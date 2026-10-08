# Receta: formulario de contacto con Web3Forms

Flujo híbrido. Web3Forms gratis solo acepta envíos desde el navegador; desde un servidor exige plan pago y lista blanca de IP.

1. La API valida y **guarda** el mensaje en PostgreSQL. Nunca se pierde.
2. Con el mensaje ya guardado, el navegador lo envía por correo con Web3Forms.
3. Si falla el correo, el usuario igual ve «Mensaje enviado», porque el ADMIN lo verá en su panel. Si falla la API, se muestra el error y no se envía nada.

## 1. Dependencias

Ninguna.

## 2. Variables de entorno (`apps/web/.env.example` y `.env.local`)

```text
# Web3Forms - formulario de contacto. Crear clave: https://web3forms.com/
# Pública por diseño: solo entrega correos a la casilla dueña de la clave.
NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=
```

Agrégala a `requiredVariableNames` de `apps/web/tests/env-example.test.ts`. Sin clave, el flujo guarda el mensaje y omite el correo.

## 3. Contrato y API

- `packages/shared/src/contact.ts`: `contactCreateSchema` con `name`, `email` (reusa el de `auth.ts`), `phone` opcional y `message` con límites, más el tipo de respuesta `{ id }`.
- Prisma: modelo `ContactMessage { id, name, email, phone?, message, userId? (SetNull), createdAt }`, más `npm run db:migrate -w @portal/api -- --name contact_messages`.
- `apps/api/src/lib/http/rate-limit.ts`: agrega a `RATE_LIMITS`:

  ```ts
  contact: { name: "contact", limit: 10, windowMs: 10 * 60 * 1000, message: "Enviaste muchos mensajes seguidos. Espera unos minutos e inténtalo de nuevo." },
  ```

- `POST /api/contact`:

  ```ts
  export async function POST(request: NextRequest) {
    const limited = rateLimit(request, RATE_LIMITS.contact);
    if (limited) return limited;
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = contactCreateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos inválidos");
    try {
      const user = await getOptionalUser(request); // visitor → null; an invalid cookie counts as a visitor
      return Response.json(await createContactMessage(parsed.data, user), { status: 201 });
    } catch (error) {
      return toErrorResponse(error);
    }
  }
  ```

## 4. Envío desde el navegador (`apps/web/src/lib/contact-submission.ts`)

```ts
import { ApiClientError, postJson } from "./api-client";

const WEB3FORMS_SUBMIT_URL = "https://api.web3forms.com/submit";

/** Emails the stored message. Never throws: the message is already saved. */
async function sendEmail(accessKey: string, id: string, data: ContactCreate): Promise<boolean> {
  try {
    const response = await fetch(WEB3FORMS_SUBMIT_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ access_key: accessKey, subject: "Nuevo mensaje de contacto", replyto: data.email, ...data, message_id: id }),
    });
    const body: unknown = await response.json().catch(() => null);
    return response.ok && Boolean(body && typeof body === "object" && "success" in body && body.success === true);
  } catch {
    return false;
  }
}

export async function submitContact(data: ContactCreate, accessKey: string | undefined) {
  let created: { id: string };
  try {
    created = await postJson<{ id: string }>("/api/contact", data);
  } catch (error) {
    return { status: "error" as const, message: error instanceof ApiClientError ? error.message : "No pudimos enviar tu mensaje. Inténtalo de nuevo." };
  }
  const emailSent = accessKey ? await sendEmail(accessKey, created.id, data) : false;
  return { status: "sent" as const, emailSent };
}
```

En el formulario (Client Component):

- valida con `contactCreateSchema` antes de enviar;
- lee `process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`;
- agrega un campo trampa (honeypot) oculto: si viene lleno, finge éxito y no envía nada;
- muestra los errores junto a cada campo.

## 5. Validación

- API (integración): 201 y fila guardada; 400 con cuerpo inválido; 429 al pasar el límite (`resetRateLimits()` en `beforeEach`); `userId` solo con sesión válida.
- `submitContact` con `fetch` simulado:
  - si la API falla, devuelve error y no llama a Web3Forms;
  - si Web3Forms falla, devuelve `sent` con `emailSent: false`.
- Manual: envía un mensaje real y comprueba que llega a la casilla de la clave.

## 6. Reversión

Borra la ruta, el servicio, el repositorio, `contact.ts`, `contact-submission.ts` y el formulario. Después:

1. Quita la regla `contact` de `RATE_LIMITS`.
2. Crea una migración que borre `ContactMessage`.
3. Quita la variable de `.env.example` y de su test.
