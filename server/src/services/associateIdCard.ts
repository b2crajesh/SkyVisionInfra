import { readFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

interface AssociateIdCardData {
  name: string;
  phone: string;
  memberCode: string;
  status: string;
  createdAt: Date;
  rank: { name: string };
}

const CARD_WIDTH = (53.98 * 72) / 25.4;
const CARD_HEIGHT = (85.6 * 72) / 25.4;
const BRAND_CHARCOAL = "#25262B";
const BRAND_GOLD = "#FFC928";
const TEXT_MUTED = "#A6A7AC";
const COMPANY_ADDRESS = "PD Mall, Padrauna, Kushinagar, UP";
const COMPANY_WEBSITE = "https://skyvisioninfra.com";
const LOGO_PATH = path.resolve(__dirname, "../../../client/public/sky-vision-logo.png");

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "A"
  );
}

function formatJoiningDate(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export async function createAssociateIdCardPdf(
  associate: AssociateIdCardData,
  photo: Buffer | null
): Promise<Buffer> {
  const [logoSource, qrCode, photoJpeg] = await Promise.all([
    readFile(LOGO_PATH),
    QRCode.toBuffer(associate.memberCode, {
      type: "png",
      errorCorrectionLevel: "H",
      margin: 1,
      width: 180,
    }),
    photo
      ? sharp(photo).resize(354, 396, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer()
      : Promise.resolve(null),
  ]);
  const logo = await sharp(logoSource)
    .extract({ left: 80, top: 145, width: 610, height: 490 })
    .resize(220, 177, { fit: "inside" })
    .jpeg({ quality: 72 })
    .toBuffer();

  const document = new PDFDocument({
    size: [CARD_WIDTH, CARD_HEIGHT],
    margin: 0,
    compress: true,
    info: {
      Title: `Associate ID Card - ${associate.memberCode}`,
      Author: "Sky Vision Infra",
    },
  });

  const chunks: Buffer[] = [];
  const pdf = new Promise<Buffer>((resolve, reject) => {
    document.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });

  document.rect(0, 0, CARD_WIDTH, CARD_HEIGHT).fill(BRAND_CHARCOAL);
  document.rect(0, 0, CARD_WIDTH, 68).fill("#1C1D21");
  document.image(logo, 44, 2, { fit: [65, 52] });
  document
    .fillColor(TEXT_MUTED)
    .font("Helvetica-Bold")
    .fontSize(5.5)
    .text("ASSOCIATE IDENTIFICATION CARD", 15, 58, {
      width: CARD_WIDTH - 30,
      align: "center",
      lineBreak: false,
    });

  document.rect(0, 68, 7, 120).fill(BRAND_GOLD);
  document.rect(CARD_WIDTH - 7, 68, 7, 120).fill(BRAND_GOLD);
  document.rect(47, 74, 59, 66).fill("#F1F5F9");
  if (photoJpeg) {
    document.image(photoJpeg, 47, 74, { width: 59, height: 66 });
  } else {
    document
      .fillColor(BRAND_CHARCOAL)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(getInitials(associate.name), 47, 98, {
        width: 59,
        align: "center",
        lineBreak: false,
      });
  }
  document.rect(47, 74, 59, 66).lineWidth(1).stroke("#D7DEE8");

  document
    .fillColor(BRAND_GOLD)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(associate.name, 12, 144, {
      width: CARD_WIDTH - 24,
      height: 18,
      align: "center",
      ellipsis: true,
    });

  document
    .fillColor("#FFFFFF")
    .font("Helvetica")
    .fontSize(8.5)
    .text(associate.rank.name, 12, 164, {
      width: CARD_WIDTH - 24,
      align: "center",
      lineBreak: false,
    });

  document
    .fillColor(TEXT_MUTED)
    .font("Helvetica")
    .fontSize(6)
    .text(`${associate.status} | JOINED ${formatJoiningDate(associate.createdAt)}`, 12, 178, {
      width: CARD_WIDTH - 24,
      align: "center",
      lineBreak: false,
    });

  document.rect(0, 188, CARD_WIDTH, CARD_HEIGHT - 188).fill("#303136");
  document.image(qrCode, 13, 191, { fit: [32, 32] });
  document
    .fillColor(TEXT_MUTED)
    .font("Helvetica-Bold")
    .fontSize(5)
    .text("ASSOCIATE CODE", 53, 191);
  document
    .fillColor(BRAND_GOLD)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(associate.memberCode, 53, 200, { width: CARD_WIDTH - 65, lineBreak: false });
  document
    .fillColor(TEXT_MUTED)
    .font("Helvetica-Bold")
    .fontSize(5)
    .text("PHONE", 53, 212);
  document
    .fillColor("#FFFFFF")
    .font("Helvetica")
    .fontSize(6.5)
    .text(associate.phone || "Not provided", 53, 220, {
      width: CARD_WIDTH - 65,
      lineBreak: false,
    });

  document.fillColor(TEXT_MUTED).font("Helvetica-Bold").fontSize(5).text("OFFICE", 12, 229);
  document
    .fillColor("#FFFFFF")
    .font("Helvetica")
    .fontSize(5.5)
    .text(COMPANY_ADDRESS, 37, 229, { width: CARD_WIDTH - 49, lineBreak: false });
  document.fillColor(TEXT_MUTED).font("Helvetica-Bold").fontSize(5).text("WEBSITE", 12, 236);
  document
    .fillColor("#FFFFFF")
    .font("Helvetica")
    .fontSize(5.5)
    .text(COMPANY_WEBSITE, 37, 236, { width: CARD_WIDTH - 49, lineBreak: false });
  document.rect(0.5, 0.5, CARD_WIDTH - 1, CARD_HEIGHT - 1).lineWidth(1).stroke(BRAND_GOLD);
  document.end();

  return pdf;
}
