import butterFlyLogo from '../../../assets/mascot-butterfly.png';
import fishLogo from '../../../assets/mascot-fish.png';
import flowerLogo from '../../../assets/mascot-flower.png';
import frogLogo from '../../../assets/mascot-frog.png';
import mreevesiLogo from '../../../assets/mascot-Mreevesi.png';

export const intro = [
  {
    id: 'project',
    img: flowerLogo,
    title: '專案管理',
    desc: '提供新資料集專案建立和過往資料集匯入的功能，可輕鬆建立、開啟所擁有的資料集，並追蹤最新的資料集版本。從專案的建立到完成，您都能掌握每一步的進度和細節。',
  },
  {
    id: 'template',
    img: frogLogo,
    title: '資料模板',
    desc: '建立並選擇依據 Darwin Core 標準定義的欄位模板，確保資料格式和結構的一致性，再透過建議的必填、選填欄位提高資料集的完整性。不僅提高了資料處理的效率，大大節省探索 Darwin Core 資料欄位的時間成本，還能減少因欄位格式導致的錯誤。',
  },
  {
    id: 'edit',
    img: mreevesiLogo,
    title: '資料編輯',
    desc: '提供類似 Excel 的編輯功能，讓您能夠直接在介面上進行資料編輯、修改和新增。自動儲存功能將保護您的資料變更不會因電腦問題或工具關閉而丟失。',
  },
  {
    id: 'validate',
    img: fishLogo,
    title: '資料驗證',
    desc: '協助檢查資料的準確性和完整性。通過自動化驗證工具，您可快速發現並修正資料中的常見錯誤，確保資料的高品質。',
  },
  {
    id: 'clearance',
    img: butterFlyLogo,
    title: '資料清理',
    desc: '提供便利的資料清理功能，協助清除或修正重複、錯誤、不完整的資料，使資料更加精確可靠。清理完成後可匯出壓縮檔，可直接將整個檔案上傳到 TaiBIF 資料發布工具 (IPT)，不僅加速資料發布的流程，亦為後續的分析應用打下堅實的基礎。',
  },
];
