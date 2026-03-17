<script>

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDfwgOnJzXn8ESDw-9siMhYP-TFJcuNFx4",
  authDomain: "tracking-doc-96d7f.firebaseapp.com",
  projectId: "tracking-doc-96d7f",
  storageBucket: "tracking-doc-96d7f.appspot.com",
  messagingSenderId: "511985866729",
  appId: "1:511985866729:web:68bf00705f680b55159d78"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// USER CHECK
let currentUser = localStorage.getItem("pic_user");
if (!currentUser) location.href = "dokumen.html";

document.getElementById("userDisplay").innerText = currentUser;
document.getElementById("pic").value = currentUser;


// STATE
let data = [];
let selectedId = null;
let currentFilter = "all";
let currentPage = 1;
const rowsPerPage = 10;


// NAVIGATION
function showPage(page){
["dashboard","input","log"].forEach(id=>{
document.getElementById(id).style.display="none";
});
document.getElementById(page).style.display="block";
}


// FILTER
function filterStatus(status){
currentFilter = currentFilter === status ? "all" : status;
currentPage = 1;
showPage("log");
render();
}


// LOAD DATA
async function loadData(){

const snapshot = await db.collection("dokumen")
.orderBy("tanggal","desc")
.get();

data = snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}));

render();
}

loadData();


// FORMAT TANGGAL
function formatTanggal(t){

if(!t) return "";

if(t.seconds){
return new Date(t.seconds*1000).toLocaleDateString("id-ID");
}

return new Date(t).toLocaleDateString("id-ID");

}


// FORMAT JAM
function formatJam(t){

if(!t) return "";

if(t.seconds){
return new Date(t.seconds*1000).toLocaleTimeString("id-ID");
}

return new Date(t).toLocaleTimeString("id-ID");

}


// RENDER
function render(){

const search = document.getElementById("search").value.toLowerCase();
const tbody = document.getElementById("tableBody");
const mobile = document.getElementById("mobileList");

tbody.innerHTML="";
mobile.innerHTML="";

let pending=0;
let done=0;

let filtered = data.filter(d=>
(d.pengirim||"").toLowerCase().includes(search) ||
(d.penerima||"").toLowerCase().includes(search)
);

if(currentFilter!=="all"){
filtered = filtered.filter(d=>d.status===currentFilter);
}

const totalPages = Math.ceil(filtered.length/rowsPerPage) || 1;

if(currentPage>totalPages){
currentPage = totalPages;
}

const start = (currentPage-1)*rowsPerPage;
const pageData = filtered.slice(start,start+rowsPerPage);

pageData.forEach(d=>{

if(d.status==="Pending") pending++;
if(d.status==="Selesai") done++;

tbody.innerHTML += `
<tr>

<td>${formatTanggal(d.tanggal)}</td>
<td>${d.pengirim}</td>
<td>${d.jenis}</td>
<td>${d.penerima}</td>
<td>${d.pic}</td>
<td>${formatJam(d.tanggal)}</td>

<td class="${d.status==="Pending"?"status-pending":"status-done"}">
${d.status}
</td>

<td>
${d.foto ? `<img src="${d.foto}" class="preview-img" onclick="window.open('${d.foto}')">` : "-"}
</td>

<td class="actions">

${d.status==="Pending"
? `<button class="btn-green" onclick="openCamera('${d.id}')">Diterima</button>`
: ""}

${currentUser === "Topa"
? `<button class="btn-red" onclick="hapus('${d.id}')">Hapus</button>`
: ""}

</td>

</tr>
`;

mobile.innerHTML += `
<div class="mobile-card">

<div class="mobile-row">
<span>Tanggal</span>
<span>${formatTanggal(d.tanggal)}</span>
</div>

<div class="mobile-row">
<span>Jenis</span>
<span>${d.jenis}</span>
</div>

<div class="mobile-row">
<span>Pengirim</span>
<span>${d.pengirim}</span>
</div>

<div class="mobile-row">
<span>Penerima</span>
<span>${d.penerima}</span>
</div>

<div class="mobile-row">
<span>PIC</span>
<span>${d.pic}</span>
</div>

<div class="mobile-row">
<span>Status</span>
<span>${d.status}</span>
</div>

${d.foto ? `<img src="${d.foto}" class="preview-img" onclick="window.open('${d.foto}')">` : ""}

<div class="mobile-actions">

${d.status==="Pending"
? `<button class="btn-green" onclick="openCamera('${d.id}')">Diterima</button>`
: ""}

${currentUser === "Topa"
? `<button class="btn-red" onclick="hapus('${d.id}')">Hapus</button>`
: ""}

</div>

</div>
`;

});

document.getElementById("total").innerText = data.length;
document.getElementById("pending").innerText = pending;
document.getElementById("done").innerText = done;

document.getElementById("pageInfo").innerText =
"Page "+currentPage+" / "+totalPages;

}


// PAGINATION
function nextPage(){
currentPage++;
render();
}

function prevPage(){
if(currentPage>1){
currentPage--;
render();
}
}


// TAMBAH DATA
async function tambah(){

document.getElementById("spinner").style.display="block";

await db.collection("dokumen").add({

tanggal:new Date(),
pengirim:pengirim.value,
jenis:jenis.value,
penerima:penerima.value,
pic:currentUser,
status:"Pending",
foto:""

});

pengirim.value="";
penerima.value="";

document.getElementById("spinner").style.display="none";

loadData();

}


// CAMERA
function openCamera(id){
selectedId = id;
document.getElementById("cameraInput").click();
}


// COMPRESS IMAGE
function compressImage(file){

return new Promise(resolve=>{

const img = new Image();
const reader = new FileReader();

reader.onload = e => img.src = e.target.result;
reader.readAsDataURL(file);

img.onload = ()=>{

const canvas = document.createElement("canvas");

const MAX_WIDTH = 800;

let width = img.width;
let height = img.height;

if(width > MAX_WIDTH){
height *= MAX_WIDTH/width;
width = MAX_WIDTH;
}

canvas.width = width;
canvas.height = height;

const ctx = canvas.getContext("2d");
ctx.drawImage(img,0,0,width,height);

canvas.toBlob(blob=>resolve(blob),"image/jpeg",0.7);

};

});

}


// UPLOAD FOTO
cameraInput.addEventListener("change",async function(){

const originalFile = this.files[0];
if(!originalFile) return;

const spinner = document.getElementById("uploadSpinner");
spinner.style.display="block";

try{

const file = await compressImage(originalFile);

const formData = new FormData();
formData.append("file",file);
formData.append("upload_preset","dokumen_upload");

const res = await fetch(
"https://api.cloudinary.com/v1_1/duonehce3/image/upload",
{method:"POST",body:formData}
);

const result = await res.json();

if(!result.secure_url){
throw new Error("Upload gagal");
}

await db.collection("dokumen")
.doc(selectedId)
.update({
status:"Selesai",
foto:result.secure_url
});

alert("Berhasil upload");

}catch(err){

alert("Upload gagal: "+err.message);

}

spinner.style.display="none";
loadData();

});


// DELETE
async function hapus(id){

if(currentUser !== "Topa"){
alert("Anda tidak memiliki akses untuk menghapus data");
return;
}

if(!confirm("Yakin ingin menghapus data ini ?")) return;

await db.collection("dokumen")
.doc(id)
.delete();

loadData();

}


// LOGOUT
function logout(){
localStorage.removeItem("pic_user");
location.href="dokumen.html";
}

</script>
