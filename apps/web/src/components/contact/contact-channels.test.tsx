import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContactChannelList } from "./contact-channels";

const empty = { whatsapp: "", email: "", instagram: "", hours: "" };

describe("ContactChannelList", () => {
  it("shows only the filled channels with their links", () => {
    const html = renderToStaticMarkup(
      <ContactChannelList channels={{ ...empty, whatsapp: "+56 9 1234 5678", email: "hola@terpenex.cl" }} />,
    );
    expect(html).toContain('href="https://wa.me/56912345678"');
    expect(html).toContain('target="_blank" rel="noopener noreferrer"');
    expect(html).toContain('href="mailto:hola@terpenex.cl"');
    expect(html).not.toContain("Instagram");
    expect(html).not.toContain("Horario");
  });

  it("shows the hours as text and instagram without the protocol", () => {
    const html = renderToStaticMarkup(
      <ContactChannelList channels={{ ...empty, instagram: "https://www.instagram.com/terpenex", hours: "Lun a vie, 10 a 18 h" }} />,
    );
    expect(html).toContain(">instagram.com/terpenex</a>");
    expect(html).toContain(">Lun a vie, 10 a 18 h</p>");
  });

  it("shows an empty state without links when no channel is set", () => {
    const html = renderToStaticMarkup(<ContactChannelList channels={empty} />);
    expect(html).toContain("Pronto publicaremos nuestros canales");
    expect(html).not.toContain("<a ");
  });
});
