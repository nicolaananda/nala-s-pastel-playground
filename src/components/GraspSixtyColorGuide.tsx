import GraspGuide from "./GraspGuide";

const GraspSixtyColorGuide = () => (
  <GraspGuide
    productTitle="Nama & Nomor Grasp Isi 60 Warna"
    productDescription="Jual nama nomor Grasp isi 60 warna, lengkap dengan contoh swatch dan file referensi premium."
    productClassName="Nama & Nomor Grasp Isi 60 Warna"
    priceLabel="Akses Sekali Beli"
    coverImageUrl="https://r2.artstudionala.com/grasp/grispy.jpg"
    orderPrefix="G60"
    requiredCodePrefix="G60-"
    allowedCodePrefixes={["G60-"]}
    accessCodeKey="graspSixtyColorAccessCode"
    sessionUnlockKey="graspSixtyColorSessionAuthorized"
    premiumPath="/grasp-sixty-color-premium"
    codePlaceholder="Contoh: G60-ABC123"
  />
);

export default GraspSixtyColorGuide;
