import { prisma } from "@/lib/prisma";
import { ShopSettingsSchema } from "@/lib/validations";

export const ShopSettingsService = {
  /**
   * Ensures that shop settings exist in the database.
   * If not, it creates a default record.
   */
  async ensureSettings() {
    const settings = await prisma.shopSettings.findFirst();

    if (!settings) {
      return await prisma.shopSettings.create({
        data: {
          name: "Barbería Razor",
          address: "Dirección por defecto",
          phone: "Teléfono por defecto",
          email: "contacto@razor.com",
        },
      });
    }

    return settings;
  },

  /**
   * Retrieves the single shop settings, initializing them if necessary.
   */
  async getSettings() {
    return await this.ensureSettings();
  },

  /**
   * Updates the shop settings.
   */
  async updateSettings(data: unknown) {
    const validated = ShopSettingsSchema.partial().parse(data);
    const settings = await this.ensureSettings();

    return await prisma.shopSettings.update({
      where: { id: settings.id },
      data: validated,
    });
  },
};
