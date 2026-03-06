
/**
 * คำแนะนำ: คัดลอกโค้ดนี้ไปวางใน Google Apps Script ของคุณ
 * 1. แก้ไข FOLDER_ID ด้านล่าง (ใส่ ID ของโฟลเดอร์ หรือ URL ของโฟลเดอร์ที่สร้างไว้ใน Drive)
 * 2. Deploy เป็น Web App:
 *    - Execute as: Me (ตัวฉัน)
 *    - Who has access: Anyone (ทุกคน) **สำคัญมาก**
 */

// ใส่ ID ของโฟลเดอร์ (เช่น "1A2B3C4D...") หรือ URL ของโฟลเดอร์ก็ได้
const FOLDER_ID = "YOUR_DRIVE_FOLDER_ID_HERE"; 

function doPost(e) {
  try {
    const contents = e.postData.contents;
    if (!contents) throw new Error("No data received");
    
    const params = JSON.parse(contents);
    const action = params.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    let result;
    if (action === 'createOrder') {
      result = createOrder(params, ss);
    } else if (action === 'updateStatus') {
      result = updateStatus(params, ss);
    } else if (action === 'addAccounting') {
      result = addAccounting(params, ss);
    } else {
      throw new Error("Invalid action: " + action);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ordersSheet = getOrCreateSheet(ss, "Orders", ["id", "customerName", "phoneNumber", "fileName", "fileUrl", "paperSize", "paperType", "printColor", "copies", "totalPrice", "status", "createdAt", "note", "paymentMethod", "slipUrl"]);
    const accountingSheet = getOrCreateSheet(ss, "Accounting", ["id", "type", "description", "amount", "date"]);
    
    const orders = getRows(ordersSheet);
    const accounting = getRows(accountingSheet);
    
    return ContentService.createTextOutput(JSON.stringify({ orders, accounting }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function createOrder(data, ss) {
  const sheet = getOrCreateSheet(ss, "Orders");
  let fileUrl = "";
  
  try {
    // ดึง Folder ID (กรณีผู้ใช้ก๊อปปี้ URL มาทั้งเส้น)
    let folderId = FOLDER_ID;
    if (folderId.includes("drive.google.com")) {
      const match = folderId.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match) folderId = match[1];
    }
    
    let folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (e) {
      console.warn("Folder ID invalid, falling back to Root");
      folder = DriveApp.getRootFolder();
    }
    
    // จัดการข้อมูลไฟล์ Base64
    const fileParts = data.fileData.split(',');
    if (fileParts.length < 2) throw new Error("Invalid file data format");
    
    const meta = fileParts[0];
    const base64Data = fileParts[1];
    const contentType = meta.split(':')[1].split(';')[0];
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, contentType, data.fileName);
    
    const file = folder.createFile(blob);
    // ตั้งค่าให้ใครก็ตามที่มีลิงก์สามารถดูไฟล์ได้ (เพื่อให้ Admin เปิดดูได้ง่าย)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // สร้าง URL แบบ Direct View เพื่อให้เปิดดูได้ง่ายขึ้นในบางเบราว์เซอร์
    const fileId = file.getId();
    fileUrl = "https://drive.google.com/uc?id=" + fileId + "&export=view";
    // หรือใช้ URL มาตรฐานของ Drive
    // fileUrl = file.getUrl();
  } catch (e) {
    fileUrl = "ERROR: " + e.message;
    console.error("File save error: " + e.message);
  }
  
  const row = [
    data.id,
    data.customerName,
    data.phoneNumber,
    data.fileName,
    fileUrl,
    data.paperSize,
    data.paperType,
    data.printColor,
    data.copies,
    data.totalPrice,
    data.status,
    data.createdAt,
    data.note || '',
    data.paymentMethod || '',
    data.slipUrl || ''
  ];
  
  sheet.appendRow(row);
  return { success: true, fileUrl: fileUrl, id: data.id };
}

function updateStatus(data, ss) {
  const sheet = getOrCreateSheet(ss, "Orders");
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  
  const colIdx = {
    id: headers.indexOf("id"),
    totalPrice: headers.indexOf("totalprice"),
    status: headers.indexOf("status"),
    paymentMethod: headers.indexOf("paymentmethod"),
    slipUrl: headers.indexOf("slipurl")
  };

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][colIdx.id] == data.id) {
      if (data.status && colIdx.status !== -1) sheet.getRange(i + 1, colIdx.status + 1).setValue(data.status);
      if (data.price !== undefined && colIdx.totalPrice !== -1) sheet.getRange(i + 1, colIdx.totalPrice + 1).setValue(data.price);
      if (data.paymentMethod && colIdx.paymentMethod !== -1) sheet.getRange(i + 1, colIdx.paymentMethod + 1).setValue(data.paymentMethod);
      
      let slipUrl = "";
      if (data.slipData) {
        try {
          let folderId = FOLDER_ID;
          if (folderId.includes("drive.google.com")) {
            const match = folderId.match(/folders\/([a-zA-Z0-9_-]+)/);
            if (match) folderId = match[1];
          }
          let folder = DriveApp.getFolderById(folderId);
          
          const fileParts = data.slipData.split(',');
          const meta = fileParts[0];
          const base64Data = fileParts[1];
          const contentType = meta.split(':')[1].split(';')[0];
          const bytes = Utilities.base64Decode(base64Data);
          const blob = Utilities.newBlob(bytes, contentType, "SLIP_" + data.id);
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          slipUrl = "https://drive.google.com/uc?id=" + file.getId() + "&export=view";
          if (colIdx.slipUrl !== -1) sheet.getRange(i + 1, colIdx.slipUrl + 1).setValue(slipUrl);
        } catch (e) {
          console.error("Slip save error: " + e.message);
        }
      } else if (data.slipUrl) {
        slipUrl = data.slipUrl;
        if (colIdx.slipUrl !== -1) sheet.getRange(i + 1, colIdx.slipUrl + 1).setValue(slipUrl);
      }
      
      return { success: true, slipUrl: slipUrl };
    }
  }
  return { success: false, message: "Order ID not found: " + data.id };
}

function addAccounting(data, ss) {
  const sheet = getOrCreateSheet(ss, "Accounting");
  sheet.appendRow([data.id, data.type, data.description, data.amount, data.date]);
  return { success: true };
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
    }
  }
  return sheet;
}

function getRows(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idIdx = headers.indexOf("id");
  
  // Mapping lowercase headers to camelCase properties
  const keyMap = {
    "customername": "customerName",
    "phonenumber": "phoneNumber",
    "filename": "fileName",
    "fileurl": "fileUrl",
    "papersize": "paperSize",
    "papertype": "paperType",
    "printcolor": "printColor",
    "totalprice": "totalPrice",
    "createdat": "createdAt",
    "paymentmethod": "paymentMethod",
    "slipurl": "slipUrl"
  };

  return data.slice(1)
    .filter(row => {
      const id = idIdx !== -1 ? row[idIdx] : row[0];
      return id && String(id).trim() !== "";
    })
    .map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        if (h) {
          const key = keyMap[h] || h;
          obj[key] = row[i];
        }
      });
      return obj;
    });
}
