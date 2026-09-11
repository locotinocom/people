export const SUPPORT_RESOURCES = {
  emergencyPhone: "112",
  countries: [
    {
      country: "Deutschland",
      service: "TelefonSeelsorge",
      numbers: ["0800 111 0111", "0800 111 0222", "116 123"],
      note: "kostenlos, Tag und Nacht",
    },
    {
      country: "Österreich",
      service: "Telefonseelsorge",
      numbers: ["142"],
      note: "kostenlos, Tag und Nacht",
    },
    {
      country: "Schweiz",
      service: "Die Dargebotene Hand",
      numbers: ["143"],
      note: "kostenlos, Tag und Nacht",
    },
  ],
} as const
