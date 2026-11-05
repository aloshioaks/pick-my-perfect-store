import { shopConfig } from "./config.js";

const defaultSize = "24 × 16";

const sampleProducts = [
  {
    id: "shiva-blue-light",
    name: "Shiva in Blue Light",
    category: "Hindu & Indian Art",
    description: "A serene portrait of Shiva in cool blue tones, with a quiet, contemplative presence.",
    image: "/assets/products/0b603e47-e1cb-4ade-9495-452b4bd8bd23.JPG",
  },
  {
    id: "cross-monochrome",
    name: "The Cross — Monochrome Study",
    category: "Christian Art",
    description: "A thoughtful charcoal-style portrait of Christ and the cross, rendered in expressive monochrome.",
    image: "/assets/products/0fa1417b-b8cd-4579-999f-7144514aeebf.JPG",
  },
  {
    id: "ganesha-festival-colours",
    name: "Ganesha in Festival Colours",
    category: "Hindu & Indian Art",
    description: "A joyful, richly coloured depiction of Ganesha, full of intricate detail and warmth.",
    image: "/assets/products/1a54bff0-4c18-4a46-af69-47bb9cc5711c.JPG",
  },
  {
    id: "sacred-heart-golden-light",
    name: "Sacred Heart in Golden Light",
    category: "Christian Art",
    description: "A luminous devotional portrait surrounded by a soft golden glow and delicate florals.",
    image: "/assets/products/1af30d76-0bb1-4f59-ab4f-a19a25eac1dd.JPG",
  },
  {
    id: "ganesha-lotus",
    name: "Ganesha Among the Lotus",
    category: "Hindu & Indian Art",
    description: "A peaceful Ganesha scene framed by lotus blooms and gentle reflections on the water.",
    image: "/assets/products/2053c960-8080-4f38-b257-b12789728d0d.JPG",
  },
  {
    id: "buddha-golden-stillness",
    name: "Buddha — Golden Stillness",
    category: "Buddhist Art",
    description: "A textured portrait of Buddha in warm gold and earth tones, made for a moment of calm.",
    image: "/assets/products/24083f11-5867-4e01-9595-570fdcb745b1.JPG",
  },
  {
    id: "sacred-heart-circle",
    name: "The Sacred Heart — A Quiet Glow",
    category: "Christian Art",
    description: "A classic devotional portrait presented within a warm, softly illuminated frame.",
    image: "/assets/products/2725c955-5b47-478b-83b3-d64066e70902.JPG",
  },
  {
    id: "theyyam-guardian-red",
    name: "Theyyam — Guardian in Red",
    category: "Kerala Heritage",
    description: "A vivid portrait celebrating the striking colours, costume and presence of Theyyam.",
    image: "/assets/products/33d37047-8955-4617-8efe-a63cd1294d74.JPG",
  },
  {
    id: "shiva-parvati-grace",
    name: "Shiva & Parvati in Divine Grace",
    category: "Hindu & Indian Art",
    description: "A tender, richly detailed depiction of Shiva and Parvati together in a moment of grace.",
    image: "/assets/products/3a4fb0a9-c995-44e0-a1e1-868ff0693d25.JPG",
  },
  {
    id: "christ-quiet-reflection",
    name: "Christ in Quiet Reflection",
    category: "Christian Art",
    description: "A contemplative portrait in deep, natural tones with a gentle, reflective mood.",
    image: "/assets/products/5256e573-632a-476e-ae72-e904537a66b8.JPG",
  },
  {
    id: "prayer-blue-light",
    name: "A Moment of Prayer",
    category: "Christian Art",
    description: "A dramatic portrait in rich blue light, capturing a still moment of prayer.",
    image: "/assets/products/565936bc-6af5-493f-8d8b-9e5a9ac09bad.JPG",
  },
  {
    id: "holy-family-tenderness",
    name: "The Holy Family — Tenderness",
    category: "Christian Art",
    description: "A gentle family portrait in soft blue and warm earth tones, full of tenderness.",
    image: "/assets/products/5fb590a9-2e4f-4c52-a1e5-e6cc93c85094.JPG",
  },
  {
    id: "christ-portrait-compassion",
    name: "Christ — Portrait of Compassion",
    category: "Christian Art",
    description: "A warm, intimate portrait of Christ with an inviting expression and rich painterly tones.",
    image: "/assets/products/697e9199-c74f-4579-95b6-57ebb4effd6e.JPG",
  },
  {
    id: "our-lady-blue-white",
    name: "Our Lady in Blue and White",
    category: "Christian Art",
    description: "A graceful portrait of Mary in blue and white, surrounded by a soft floral glow.",
    image: "/assets/products/6cca9919-7a2c-4912-9947-0264d7a44ac7.JPG",
  },
  {
    id: "walking-into-light",
    name: "Walking into the Light",
    category: "Christian Art",
    description: "A serene figure moving through a softly textured landscape toward a bright horizon.",
    image: "/assets/products/7b3a72ee-62d8-4a42-8650-c08ae7bc24a8.JPG",
  },
  {
    id: "madonna-child-embrace",
    name: "Madonna and Child — A Tender Embrace",
    category: "Christian Art",
    description: "A tender close portrait of Mary and the child Jesus in gentle, golden tones.",
    image: "/assets/products/da87ec79-1fde-4939-9bf5-5f2e52f8c311.JPG",
  },
  {
    id: "christ-radiant-light",
    name: "Christ in Radiant Light",
    category: "Christian Art",
    description: "A welcoming devotional image with flowing red robes and a bright, uplifting glow.",
    image: "/assets/products/e313d5f9-d371-41ae-b326-100d24059aad.JPG",
  },
  {
    id: "holy-family-sacred-bond",
    name: "The Holy Family — A Sacred Bond",
    category: "Christian Art",
    description: "A richly coloured family scene with a warm, intimate composition.",
    image: "/assets/products/f617dc26-1de1-47dd-83ea-b6ccbc590397.JPG",
  },
  {
    id: "shiva-parvati-dance",
    name: "Shiva & Parvati — Dance of Creation",
    category: "Hindu & Indian Art",
    description: "A dramatic bronze-toned scene of Shiva and Parvati in an expressive celestial dance.",
    image: "/assets/products/fcce4987-dce8-4f77-9796-11737529339d.JPG",
  },
].map((product, index) => ({
  ...product,
  price: 70,
  size: defaultSize,
  featured_order: index,
  is_active: true,
}));

export function getSampleProducts() {
  return sampleProducts.map((product) => ({ ...product }));
}

export function normalizeProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? "",
    image: row.image_url ?? row.image ?? "",
    price: Number(row.price),
    size: row.size ?? defaultSize,
    featured_order: Number(row.featured_order ?? 0),
    is_active: row.is_active !== false,
  };
}

export function formatPrice(price) {
  return new Intl.NumberFormat(shopConfig.locale, {
    style: "currency",
    currency: shopConfig.currency,
  }).format(price);
}
