// ================================
// Global Variables
// ================================
let canvas = document.getElementById("memeCanvas");
let ctx = canvas.getContext("2d");
let uploadedImage = null;
let textBoxes = [];
let emojis = [];
let stickers = [];
let gifFrames = [];
let selectedElement = null;
let offsetX=0, offsetY=0, isRotating=false;

// ================================
// Tab Switching
// ================================
document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
        document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        let tab=btn.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(tc=>tc.classList.remove('active'));
        document.getElementById(tab).classList.add('active');
    });
});

// ================================
// Theme Toggle
// ================================
document.getElementById('toggleTheme').addEventListener('click',()=>{
    if(document.body.classList.contains('dark')){ document.body.classList.remove('dark'); document.body.classList.add('light'); }
    else{ document.body.classList.remove('light'); document.body.classList.add('dark'); }
});
document.body.classList.add('light'); // default

// ================================
// Image Upload
// ================================
document.getElementById("uploadImage").addEventListener("change", e=>{
    let file=e.target.files[0]; if(!file) return;
    let reader=new FileReader();
    reader.onload=function(event){ uploadedImage=event.target.result; generateMeme(); };
    reader.readAsDataURL(file);
});

// ================================
// Add Text
// ================================
document.getElementById("addTextBtn").addEventListener('click',()=>{
    let newText=prompt('Enter text:');
    if(newText){
        textBoxes.push({text:newText,x:canvas.width/2,y:canvas.height/2,size:40,bold:false,color:'white',rotation:0});
        generateMeme();
    }
});

// ================================
// Generate Meme
// ================================
function generateMeme(){
    canvas.width = uploadedImage ? 500 : 500;
    canvas.height = uploadedImage ? 500 : 500;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(uploadedImage){
        let img = new Image();
        img.crossOrigin="anonymous";
        img.src = uploadedImage;
        img.onload=()=>{ ctx.drawImage(img,0,0,canvas.width,canvas.height); drawElements(); };
    } else { drawElements(); }
}

function drawElements(){
    [...textBoxes,...emojis,...stickers].forEach(el=>{
        ctx.save();
        ctx.translate(el.x,el.y);
        ctx.rotate(el.rotation||0);
        if(el.text){
            ctx.font = `${el.bold?'bold ':''}${el.size}px Arial`;
            ctx.textAlign='center';
            ctx.fillStyle=el.color;
            ctx.fillText(el.text,0,0);
        } else if(el.emoji){
            ctx.font = `${el.size}px Arial`;
            ctx.textAlign='center';
            ctx.fillText(el.emoji,0,0);
        } else if(el.img){
            ctx.drawImage(el.img,-el.width/2,-el.height/2,el.width,el.height);
        }
        ctx.restore();
    });
}

// ================================
// Download PNG
// ================================
document.getElementById('downloadPngBtn').addEventListener('click',()=>{
    const link=document.createElement('a');
    link.href=canvas.toDataURL('image/png');
    link.download='meme.png';
    link.click();
});

// ================================
// AI Meme Maker
// ================================
const aiTemplatesContainer=document.getElementById('aiTemplates');

async function fetchTrendingTemplates(){
    let res=await fetch('https://api.imgflip.com/get_memes');
    let data=await res.json();
    renderTemplates(data.data.memes.slice(0,20));
}

function renderTemplates(list){
    aiTemplatesContainer.innerHTML='';
    list.forEach(template=>{
        let img=document.createElement('img');
        img.src=template.url; img.title=template.name;
        img.addEventListener('click',()=>{ promptAICaption(template.id); });
        aiTemplatesContainer.appendChild(img);
    });
}

async function promptAICaption(templateId){
    const top=document.getElementById('aiTopText').value;
    const bottom=document.getElementById('aiBottomText').value;

    try{
        const res=await fetch('/api/generateMeme',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({template_id:templateId,top,bottom})
        });
        const data=await res.json();
        if(data.success){
            window.open(data.data.url,'_blank');

            const gallery=document.getElementById('memeGallery');
            const img=document.createElement('img'); img.src=data.data.url;
            const card=document.createElement('div'); card.className='card'; card.appendChild(img);
            gallery.appendChild(card);
        } else alert('Error generating meme');
    } catch(err){ alert('Server error: '+err.message); }
}

document.getElementById('searchBtn').addEventListener('click',async()=>{
    const keyword=document.getElementById('searchKeyword').value.trim().toLowerCase();
    let res=await fetch('https://api.imgflip.com/get_memes');
    let data=await res.json();
    const filtered=data.data.memes.filter(m=>m.name.toLowerCase().includes(keyword));
    renderTemplates(filtered);
});

fetchTrendingTemplates();
