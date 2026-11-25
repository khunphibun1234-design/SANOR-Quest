// Embed the rendered card as a single A4 page so the file works without a print dialog.
function welcomePdf(jpeg, width, height) {
  const encode = text => new TextEncoder().encode(text);
  const parts = [];
  const offsets = [0];
  let size = 0;
  function append(value) {
    const bytes = typeof value === 'string' ? encode(value) : value;
    parts.push(bytes);
    size += bytes.length;
  }
  function object(id, ...body) {
    offsets[id] = size;
    append(id+' 0 obj\n');
    body.forEach(append);
    append('\nendobj\n');
  }
  append('%PDF-1.4\n');
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Card 4 0 R >> >> /Contents 5 0 R >>');
  object(4,'<< /Type /XObject /Subtype /Image /Width '+width+' /Height '+height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n',jpeg,'\nendstream');
  const draw='q 595.28 0 0 841.89 0 0 cm /Card Do Q\n';
  object(5,'<< /Length '+draw.length+' >>\nstream\n'+draw+'endstream');
  const start=size;
  append('xref\n0 6\n0000000000 65535 f \n');
  offsets.slice(1).forEach(n=>append(String(n).padStart(10,'0')+' 00000 n \n'));
  append('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF');
  return new Blob(parts,{type:'application/pdf'});
}

function renderWelcomeCard(report) {
  const canvas=document.createElement('canvas');
  canvas.width=1240;
  canvas.height=1754;
  const ctx=canvas.getContext('2d');
  const groups=[
    [report.dataset.header||'SANOR QUEST  /  MAP 01',24,true],
    [report.dataset.title||'My Home Welcome Card',54,true],
    ...Array.from(report.querySelectorAll('.stats > div'),node=>[
      node.querySelector('strong').textContent+'  ·  '+node.querySelector('span').textContent,32,false]),
    ...Array.from(report.querySelectorAll(':scope > p:not(.report-note)'),node=>[node.textContent,32,false]),
    [report.querySelector('.welcome-card h3').textContent,44,true],
    ...Array.from(report.querySelectorAll('.welcome-card p'),node=>[node.textContent,38,false]),
    [report.querySelector('.report-note').innerText,27,false]
  ];
  const margin=84, available=canvas.width-2*margin;
  function layout(scale,paint) {
    let y=margin;
    for(const [text,base,bold] of groups){
      const size=Math.round(base*scale);
      ctx.font=(bold?'bold ':'')+size+'px system-ui, sans-serif';
      for(const paragraph of text.split(/\n/)){
        let line='';
        function flush(){if(paint)ctx.fillText(line,margin,y);y+=size*1.38;line='';}
        for(const word of paragraph.split(/\s+/)){
          if(line && ctx.measureText(line+' '+word).width>available)flush();
          if(line)line+=' ';
          for(const ch of word){
            if(line && ctx.measureText(line+ch).width>available)flush();
            line+=ch;
          }
        }
        flush();
      }
      y+=size*.65;
    }
    return y;
  }
  let scale=1;
  while(layout(scale,false)>canvas.height-margin && scale>.4)scale-=.05;
  ctx.fillStyle='#fffdf5';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#21483b';ctx.fillRect(margin,50,available,5);
  ctx.textBaseline='top';
  layout(scale,true);
  return canvas;
}

function prepareWelcomePrint(report) {
  const panel=document.getElementById('cardPrintOptions');
  panel.hidden=false;
  const link=document.getElementById('downloadWelcome');
  if(link.href.startsWith('blob:'))URL.revokeObjectURL(link.href);
  const canvas=renderWelcomeCard(report);
  const data=canvas.toDataURL('image/jpeg',.94);
  document.getElementById('screenshotCard').src=data;
  const bytes=Uint8Array.from(atob(data.split(',')[1]),c=>c.charCodeAt(0));
  link.href=URL.createObjectURL(welcomePdf(bytes,canvas.width,canvas.height));
  link.focus();
}
