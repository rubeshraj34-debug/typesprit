import type { CertAttempt } from './db';
import { verifyUrl } from './cert';

export async function downloadCertificate(a: CertAttempt) {
  if (!a.passed || !a.code || !a.serial) throw new Error('Certificates are only issued for passed tests.');
  const [{ jsPDF }, QR] = await Promise.all([import('jspdf'), import('qrcode')]);
  const url = verifyUrl(a.code);
  const qr = await QR.toDataURL(url, { margin: 0, width: 300, errorCorrectionLevel: 'M', color: { dark: '#0e0e0e', light: '#ffffff' } });

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const ink: [number, number, number] = [14, 14, 14];
  const orange: [number, number, number] = [255, 90, 31];
  const green: [number, number, number] = [10, 143, 79];
  const sun: [number, number, number] = [255, 216, 77];
  const cream: [number, number, number] = [247, 246, 241];

  // Background + brutalist offset frame
  doc.setFillColor(...cream);
  doc.rect(0, 0, W, 210, 'F');
  doc.setFillColor(...ink);
  doc.rect(15, 15, 270, 183, 'F');
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...ink);
  doc.setLineWidth(1.4);
  doc.rect(11, 11, 270, 183, 'FD');

  // Header band
  doc.setFillColor(...orange);
  doc.rect(11, 11, 270, 24, 'FD');
  doc.setFillColor(255, 255, 255);
  doc.rect(19, 16, 14, 14, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ink);
  doc.setFontSize(16);
  doc.text('T', 26, 26, { align: 'center' });
  doc.setFontSize(18);
  doc.text('TYPESPRINT', 38, 26);
  doc.setFontSize(8);
  doc.text('TYPING CERTIFICATION BOARD', 38, 30.5);
  doc.setFontSize(8);
  doc.text('CERTIFICATE NO.', 273, 21.5, { align: 'right' });
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.text(a.serial, 273, 28.5, { align: 'right' });

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text('CERTIFICATE OF TYPING PROFICIENCY', W / 2 - 4, 56, { align: 'center' });
  doc.setFillColor(...sun);
  doc.setLineWidth(0.8);
  const lvlLabel = `LEVEL ${a.level} \u2014 ${a.levelName.toUpperCase()}`;
  doc.setFontSize(11);
  const lw = doc.getTextWidth(lvlLabel) + 12;
  doc.rect(W / 2 - 4 - lw / 2, 61, lw, 9, 'FD');
  doc.text(lvlLabel, W / 2 - 4, 67.3, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(70, 70, 70);
  doc.text('This is to certify that', W / 2 - 4, 82, { align: 'center' });

  // Name
  doc.setTextColor(...ink);
  doc.setFont('times', 'bolditalic');
  let size = 38;
  doc.setFontSize(size);
  while (doc.getTextWidth(a.name) > 200 && size > 20) doc.setFontSize(--size);
  doc.text(a.name, W / 2 - 4, 98, { align: 'center' });
  doc.setDrawColor(...green);
  doc.setLineWidth(1.6);
  doc.line(W / 2 - 4 - 80, 102.5, W / 2 - 4 + 80, 102.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(50, 50, 50);
  const lang = a.lang === 'hi' ? 'Hindi' : 'English';
  const lines = doc.splitTextToSize(
    `${a.location ? `of ${a.location}, ` : ''}has successfully passed the TypeSprint ${lang} Typing Certification Test at Level ${a.level} (${a.levelName}), meeting the required standard of ${a.requiredWpm} WPM with at least ${a.requiredAccuracy}% accuracy in a ${a.duration / 60}-minute timed assessment. Scores were validated by the TypeSprint certification server.`,
    190,
  );
  doc.text(lines, W / 2 - 4, 111, { align: 'center' });

  // Stat boxes
  const date = new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const stats: [string, string, [number, number, number]][] = [
    ['NET SPEED', `${Math.round(a.wpm)} WPM`, orange],
    ['ACCURACY', `${a.accuracy.toFixed(1)}%`, [230, 246, 237]],
    ['DURATION', `${a.duration / 60} MIN`, [255, 255, 255]],
    ['DATE OF ISSUE', date, [255, 255, 255]],
  ];
  const bw = 44;
  const gap = 4;
  const sx = 60;
  stats.forEach(([l, v, c], i) => {
    const x = sx + i * (bw + gap);
    doc.setDrawColor(...ink);
    doc.setLineWidth(0.8);
    doc.setFillColor(...ink);
    doc.rect(x + 1.2, 135.2, bw, 18, 'F');
    doc.setFillColor(...c);
    doc.rect(x, 134, bw, 18, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...ink);
    doc.text(l, x + 3, 139);
    doc.setFontSize(i === 3 ? 9.5 : 14);
    doc.text(v, x + 3, 148);
  });

  // Seal
  const cx = 36;
  const cy = 160;
  doc.setFillColor(...green);
  doc.setDrawColor(...ink);
  doc.setLineWidth(1);
  doc.circle(cx, cy, 15, 'FD');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.circle(cx, cy, 12.5, 'S');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('CERTIFIED', cx, cy - 4.5, { align: 'center' });
  doc.setFontSize(15);
  doc.text(`L${a.level}`, cx, cy + 2.5, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text(a.levelName.toUpperCase(), cx, cy + 7, { align: 'center' });

  // Signature
  doc.setTextColor(...ink);
  doc.setFont('times', 'italic');
  doc.setFontSize(16);
  doc.text('TypeSprint Board', 112, 172, { align: 'center' });
  doc.setDrawColor(...ink);
  doc.setLineWidth(0.5);
  doc.line(82, 175, 142, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CONTROLLER OF CERTIFICATION', 112, 180, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('TypeSprint Typing Certification Board', 112, 184, { align: 'center' });

  // QR + verification
  doc.setDrawColor(...ink);
  doc.setLineWidth(0.8);
  doc.rect(238, 152, 36, 36, 'S');
  doc.addImage(qr, 'PNG', 240, 154, 32, 32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SCAN TO VERIFY', 232, 160, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(70, 70, 70);
  doc.text(['Verify this certificate at', `${window.location.host}/verify`, 'using the QR code or serial', a.serial], 232, 165, { align: 'right' });

  // Footer strip
  doc.setFont('courier', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(140, 140, 140);
  doc.text(`Digitally signed \u00b7 ${a.code.slice(-22)}`, 146, 191, { align: 'center' });

  doc.setProperties({ title: `TypeSprint Certificate ${a.serial}`, subject: 'Typing Proficiency Certificate', author: 'TypeSprint' });
  doc.save(`TypeSprint-Certificate-${a.serial}.pdf`);
}
