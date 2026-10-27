const escapeHtml=value=>String(value??'-').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const rupiah=value=>Number(value).toLocaleString('id-ID');
const jakarta=value=>new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'long',timeStyle:'short'}).format(new Date(value)).replace(' pukul ', ' pukul ');

export const memberPaymentMessage=({orderId,amount,paymentType='qris',paidAt,name,email,planName,durationDays,expiresAt,accessMode})=>[
  '🎉 <b>MEMBER BERHASIL BERLANGGANAN</b>',
  '🎨 Nala Member',
  '',
  '<b>💳 Pembayaran</b>',
  `• Order ID: <code>${escapeHtml(orderId)}</code>`,
  `• Paket: ${escapeHtml(planName)}`,
  `• Nominal: Rp ${rupiah(amount)}`,
  `• Durasi: ${escapeHtml(durationDays)} hari`,
  `• Metode: ${escapeHtml(String(paymentType).toUpperCase())}`,
  '• Status: ✅ LUNAS',
  '',
  '<b>👤 Data Member</b>',
  `• Nama: ${escapeHtml(name)}`,
  `• Email: ${escapeHtml(email)}`,
  '',
  '<b>📅 Akses</b>',
  `• Jenis: ${accessMode==='selected'?'Kelas terpilih':'Semua kelas'}`,
  `• Aktif sampai: ${jakarta(expiresAt)}`,
  '',
  `🕒 <i>${jakarta(paidAt)} WIB</i>`,
].join('\n');

export const sendMemberPaymentTelegram=async(details,{token=process.env.TELEGRAM_BOT_TOKEN,chatIds=process.env.TELEGRAM_CHAT_ID,fetchImpl=fetch}={})=>{
  if(!token||!chatIds)return false;
  const ids=String(chatIds).split(',').map(x=>x.trim()).filter(Boolean);
  if(!ids.length)return false;
  const text=memberPaymentMessage(details);
  const responses=await Promise.allSettled(ids.map(async chatId=>{
    const response=await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:chatId,text,parse_mode:'HTML',disable_web_page_preview:true})});
    if(!response.ok)throw Error(`Telegram HTTP ${response.status}`);
  }));
  return responses.every(x=>x.status==='fulfilled');
};
