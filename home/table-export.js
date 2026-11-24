function prepareTableExport(form, results) {
  const panel = document.getElementById('exportPanel');
  const image = document.getElementById('resultImage');
  const download = document.getElementById('resultPdf');
  const share = document.getElementById('sharePdf');
  const status = document.getElementById('exportStatus');
  if (download.href.startsWith('blob:')) URL.revokeObjectURL(download.href);
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#21483b';
  ctx.textBaseline = 'top';
  let y = 64;
  function line(text, size, bold = false) {
    ctx.font = (bold ? 'bold ' : '') + size + 'px system-ui, sans-serif';
    let segment = '';
    for (const character of text) {
      if (ctx.measureText(segment + character).width > 1110) {
        ctx.fillText(segment, 65, y);
        y += size * 1.4;
        segment = '';
      }
      segment += character;
    }
    ctx.fillText(segment, 65, y);
    y += size * 1.4 + 8;
  }
  line('SANOR QUEST  ·  MAP 01', 28, true);
  line('Alex’s Table', 54, true);
  for (const field of form.querySelectorAll('input')) {
    line(field.labels[0].textContent.trim() + ': ' + field.value.trim(), 32);
  }
  y += 16;
  for (const p of results.querySelectorAll(':scope > p')) {
    if (!p.querySelector('button')) line(p.textContent, 30);
  }
  y += 14;
  const columns = [65, 360, 662, 865];
  for (const row of results.querySelector('table').rows) {
    ctx.font = (row.rowIndex === 0 ? 'bold ' : '') + '34px system-ui, sans-serif';
    Array.from(row.cells).forEach((cell, index) => {
      ctx.fillText(cell.textContent, columns[index], y, (columns[index+1] || 1180)-columns[index]-12);
    });
    y += 64;
    ctx.fillRect(65, y - 12, 1110, 1);
  }
  const jpeg = canvas.toDataURL('image/jpeg', .94);
  image.src = jpeg;
  const bytes = Uint8Array.from(atob(jpeg.split(',')[1]), c => c.charCodeAt(0));
  const pdf = welcomePdf(bytes, canvas.width, canvas.height);
  download.href = URL.createObjectURL(pdf);
  const file = typeof File === 'function' ? new File([pdf], download.download, {type:'application/pdf'}) : null;
  const payload = {files:[file]};
  share.hidden = !(file && navigator.canShare?.(payload));
  share.onclick = async () => {
    try { await navigator.share(payload); }
    catch (error) { if (error.name !== 'AbortError') status.textContent = 'Open the PDF below or take a screenshot of your report.'; }
  };
  status.textContent = 'Your report is ready. Open the PDF to print or save it, or take a screenshot below.';
  panel.hidden = false;
  panel.scrollIntoView({block:'start'});
  panel.focus({preventScroll:true});
}
