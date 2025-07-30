"use strict";
// File: backend/src/utils/generatepdf.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePrescriptionPdf = void 0;
const fs_1 = __importDefault(require("fs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const crypto_1 = __importDefault(require("crypto"));
function generatePrescriptionId(length = 12) {
    return crypto_1.default.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length)
        .toUpperCase();
}
async function generatePrescriptionPdf(data) {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 40 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);
        // Color Palette
        const PRIMARY = '#4E5D6C'; // Deep steel
        const ACCENT = '#F4B41A'; // Warm gold
        const LIGHT = '#F9F9F9';
        const TEXT = '#333333';
        // Generate ID
        const prescriptionNo = generatePrescriptionId();
        // Background Accent Bar (Left side)
        doc.rect(0, 0, 80, doc.page.height).fill(PRIMARY);
        // Clinic Logo & Name (Top Left Accent)
        if (data.clinicLogoPath && fs_1.default.existsSync(data.clinicLogoPath)) {
            doc.image(data.clinicLogoPath, 15, 30, { width: 50, align: 'center' });
        }
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#FFFFFF')
            .text(data.clinicName, 15, 90, { width: 50, align: 'center' });
        // Header Title
        doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(24)
            .text('Prescription', 120, 30);
        doc.moveTo(120, 60).lineTo(doc.page.width - 20, 60)
            .strokeColor(ACCENT).lineWidth(2).stroke();
        // Top Details Card
        const cardY = 70;
        doc.roundedRect(120, cardY, doc.page.width - 160, 100, 10)
            .fill(LIGHT).strokeColor(PRIMARY).lineWidth(0.5).stroke();
        // Prescription # & Dates
        doc.fillColor(TEXT).fontSize(10).font('Helvetica')
            .text(`Prescription Id: # ${prescriptionNo}`, 130, cardY + 10)
            .text(`Issued: ${data.issueDate.toLocaleDateString('en-GB')}`, 130, cardY + 25)
            .text(`Appt: ${data.appointmentDate}`, 130, cardY + 40);
        // Doctor & Patient
        doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10)
            .text('Doctor:', 350, cardY + 10)
            .font('Helvetica').text(`Dr. ${data.doctorName}${data.doctorSpecialty ? ` (${data.doctorSpecialty})` : ''}`, 400, cardY + 10)
            .font('Helvetica-Bold').text('Patient:', 350, cardY + 30)
            .font('Helvetica').text(data.patientName, 400, cardY + 30);
        // Patient Contact & Message
        const contactY = cardY + 50;
        doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9);
        if (data.patientMessage) {
            doc.font('Helvetica-Bold').text('Notes:', 350, contactY + 30)
                .font('Helvetica').text(data.patientMessage, 400, contactY + 30, {
                width: doc.page.width - 450
            });
        }
        // Table Header
        const startY = cardY + 140;
        const cols = [120, 280, 360, 440, 520];
        const headers = ['Medicine', 'Times/Day', 'Interval', 'Duration', 'Period  '];
        headers.forEach((txt, idx) => {
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10)
                .rect(cols[idx], startY, idx < headers.length - 1
                ? cols[idx + 1] - cols[idx]
                : doc.page.width - 40 - cols[idx], 20)
                .fill(PRIMARY)
                .fillColor('#FFFFFF')
                .text(txt, cols[idx] + 3, startY + 5);
        });
        // Table Rows
        let y = startY + 25;
        data.prescriptionItems.forEach(item => {
            doc.fillColor(TEXT).font('Helvetica').fontSize(9)
                .text(item.medicineName, cols[0] + 3, y)
                .text(item.timesPerDay.toString(), cols[1] + 3, y)
                .text(item.intervalDays.toString(), cols[2] + 3, y)
                .text(item.durationDays.toString(), cols[3] + 3, y)
                .text(`${item.beginDate} TO  ${item.endDate}`, cols[4] + 3, y);
            y += 20;
        });
        // Footer with Contact & Accent Line
        doc.moveTo(120, doc.page.height - 80)
            .lineTo(doc.page.width - 40, doc.page.height - 80)
            .strokeColor(ACCENT)
            .lineWidth(1)
            .dash(3, { space: 2 })
            .stroke()
            .undash();
        doc.fillColor(TEXT).font('Helvetica').fontSize(9)
            .text(data.clinicAddress, 120, doc.page.height - 70)
            .text(`Email: medicoX@gmail.com | Phone: +91 8597786209`, 120, doc.page.height - 55);
        doc.end();
    });
}
exports.generatePrescriptionPdf = generatePrescriptionPdf;
