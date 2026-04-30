import jsPDF from 'jspdf';


// Watermark Supermarket Brand Colors for PDF
export const PDF_COLORS = {
  mainBg: '#071C35',
  tealHeader: '#135A8E',
  colHeader: '#288E8E',
  textBase: '#071C35',
  brushedMetal: '#A1B6D0',
};

// Add standard header to any jsPDF document
export const addWatermarkHeader = (doc: jsPDF, title: string) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Replace with actual logo data URI in production
  // doc.addImage(logoDataUri, 'PNG', 20, 20, 30, 30);
  
  // Fallback if no image: draw a circle placeholder
  doc.setFillColor(PDF_COLORS.tealHeader);
  doc.circle(35, 35, 15, 'F');
  
  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(PDF_COLORS.mainBg);
  doc.text('WATERMARK SUPERMARKET', 60, 30);
  
  // Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Pavilion Global, Commerce Ave. cor. Grand Blvd.,', 60, 38);
  doc.text('Alabang, Muntinlupa City 1780', 60, 44);
  
  // Document Title (Top Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(PDF_COLORS.tealHeader);
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, pageWidth - 20 - titleWidth, 35);
  
  // Divider Line
  doc.setDrawColor(PDF_COLORS.brushedMetal);
  doc.setLineWidth(0.5);
  doc.line(20, 55, pageWidth - 20, 55);
  
  return 65; // Return the Y position where the next content should start
};

// Add signature footer
export const addSignatureFooter = (doc: jsPDF, names: { title: string, name: string }[], startY: number) => {
  const pageWidth = doc.internal.pageSize.width;
  const colWidth = (pageWidth - 40) / names.length;
  
  names.forEach((item, index) => {
    const x = 20 + (index * colWidth);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(PDF_COLORS.textBase);
    doc.text(item.title, x, startY);
    
    // Signature Line
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(x, startY + 20, x + colWidth - 10, startY + 20);
    
    // Name
    doc.setFont('helvetica', 'bold');
    doc.text(item.name, x, startY + 25);
    
    // Signature / Date label
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Signature / Date', x, startY + 30);
  });
};
