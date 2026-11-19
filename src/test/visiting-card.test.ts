import { describe, expect, it } from "vitest";
import { buildVCard, qrPayload, waNumber, MAX_CARD_BRANDS, CARD_W, CARD_H, type VisitingCard } from "@/lib/visiting-card";
const c: VisitingCard = { fullName: "K. Mahesh Kumar", designation: "Medical Representative", territory: "", phone: "98765 43210", phone2: "", email: "m@biorica.in", website: "www.biorica.in", address: "", showPhoto: false, photo: "", qr: "vcard", brands: [], template: "split" };
describe("visiting cards", () => {
  it("is 3.5x2in at 300 DPI", () => { expect([CARD_W, CARD_H]).toEqual([1050, 600]); });
  it("allows up to 6 featured brands", () => { expect(MAX_CARD_BRANDS).toBe(6); });
  it("vCard saves the mobile number", () => { expect(buildVCard(c, "Biorica")).toContain("TEL;TYPE=CELL:9876543210"); });
  it("WhatsApp QR adds India code to 10-digit numbers", () => { expect(waNumber("98765 43210")).toBe("919876543210"); expect(qrPayload({ ...c, qr: "whatsapp" }, "B")).toBe("https://wa.me/919876543210"); });
  it("portal QR opens visuals.biorica.in", () => { expect(qrPayload({ ...c, qr: "portal" }, "B")).toBe("https://visuals.biorica.in"); });
});
