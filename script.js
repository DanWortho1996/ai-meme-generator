// --- TAB SWITCHING ---
document.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
        document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(tc=>tc.classList.remove('active'));
        document.getElementById(tab).classList.add('active');
        if(tab==='favorites') loadFavorites();
        if(tab==='gifs') fetchTrendingGIFs();
        if(tab==='memes') fetchTrendingMemes();
    });
});

// --- LIGHT/DARK ---
document.getElementById('theme-toggle').addEventListener('click',()=>document.body.classList.toggle('dark'));

// --- POPUPS ---
function showPopup(msg,type='success'){
    const container=document.getElementById('popup-container');
    const popup=document.createElement('div');
    popup.className=`popup ${type}`;
    popup.innerHTML=`<span>${msg}</span><button>&times;</button>`;
    popup.querySelector('button').addEventListener('click',()=>popup.remove());
    container.appendChild(popup);
    setTimeout(()=>popup.remove(),3000);
}

// --- CUSTOM EDITOR ---
let canvas=document.getElementById('memeCanvas');
let ctx=canvas.getContext('2d');
let uploadedImage=null;
let textBoxes=[{text:'Top Text',x:200,y:50,size:40,bold:false,color:'white',outline:2,rotation:0}];
let emojis=[]; let stickers=[];

// --- IMAGE UPLOAD ---
document.getElementById('uploadImage').addEventListener('change',e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{uploadedImage=ev.target.result;generateMeme();};
    reader.readAsDataURL(file);
});

// --- ADD TEXT ---
document.getElementById('addTextBtn').addEventListener('click',()=>{
    const t=prompt('Enter text:'); if(!t) return;
    textBoxes.push({text:t,x:canvas.width/2,y:canvas.height/2,size:40,bold:false,color:'white',outline:2,rotation:0});
    generateMeme();
});

// --- ADD EMOJI ---
document.getElementById('addEmojiBtn').addEventListener('click',()=>{
    const e=document.getElementById('emojiSelect').value;
    emojis.push({emoji:e,x:canvas.width/2,y:canvas.height/2,size:50,rotation:0});
    generateMeme();
});

// --- DOWNLOAD ---
document.getElementById('generateBtn').addEventListener('click',()=>{
    const link=document.createElement('a'); link.href=canvas.toDataURL(); link.download='meme.png'; link.click();
    showPopup('Meme downloaded!');
});

// --- FAVORITES ---
function saveFavorite(){
    const data=canvas.toDataURL();
    let favs=JSON.parse(localStorage.getItem('favorites')||'[]');
    favs.push(data); localStorage.setItem('favorites',JSON.stringify(favs));
    showPopup('Saved to Favorites!');
}
document.getElementById('saveGalleryBtn').addEventListener('click',saveFavorite);
function loadFavorites(){
    const favs=JSON.parse(localStorage.getItem('favorites')||'[]');
    const container=document.getElementById('favorites-container'); container.innerHTML='';
    favs.forEach(f=>{
        const div=document.createElement('div'); div.className='card';
        const img=document.createElement('img'); img.src=f; div.appendChild(img);
        container.appendChild(div);
    });
}

// --- GENERATE MEME FUNCTION ---
function generateMeme(){
    if(!uploadedImage) return;
    const img=new Image(); img.src=uploadedImage; img.onload=()=>{
        canvas.width=img.width; canvas.height=img.height;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(img,0,0);
        // Text
        textBoxes.forEach(box=>{
            ctx.save(); ctx.translate(box.x,box.y); ctx.rotate((box.rotation||0)*Math.PI/180);
            ctx.font=`${box.bold?'bold ':''}${box.size}px Arial`; ctx.textAlign='center';
            ctx.fillStyle=box.color; ctx.strokeStyle='black'; ctx.lineWidth=box.outline||2;
            ctx.fillText(box.text,0,0); ctx.strokeText(box.text,0,0); ctx.restore();
        });
        // Emojis
        emojis.forEach(e=>{
            ctx.save(); ctx.translate(e.x,e.y); ctx.rotate((e.rotation||0)*Math.PI/180);
            ctx.font=`${e.size}px Arial`; ctx.textAlign='center'; ctx.fillText(e.emoji,0,0); ctx.restore();
        });
        // Stickers
        stickers.forEach(s=>{
            ctx.save(); ctx.translate(s.x,s.y); ctx.rotate((s.rotation||0)*Math.PI/180);
            ctx.drawImage(s.img,-s.width/2,-s.height/2,s.width,s.height); ctx.restore();
        });
    };
}

// --- DRAGGING ---
let selectedItem=null; let offsetX=0, offsetY=0;
canvas.addEventListener('mousedown',e=>{
    const rect=canvas.getBoundingClientRect(); const x=e.clientX-rect.left; const y=e.clientY-rect.top;
    selectedItem=textBoxes.find(box=>{
        const w=ctx.measureText(box.text).width; const h=box.size;
        return x>=box.x-w/2 && x<=box.x+w/2 && y>=box.y-h && y<=box.y;
    });
    if(!selectedItem) selectedItem=emojis.find(em=>Math.abs(em.x-x)<em.size && Math.abs(em.y-y)<em.size);
    if(!selectedItem) selectedItem=stickers.find(st=>Math.abs(st.x-x)<st.width/2 && Math.abs(st.y-y)<st.height/2);
    if(selectedItem){ offsetX=x-(selectedItem.x||0); offsetY=y-(selectedItem.y||0); }
});
canvas.addEventListener('mousemove',e=>{
    if(!selectedItem) return;
    const rect=canvas.getBoundingClientRect(); const x=e.clientX-rect.left; const y=e.clientY-rect.top;
    selectedItem.x=x-offsetX; selectedItem.y=y-offsetY; generateMeme();
});
canvas.addEventListener('mouseup',e=>selectedItem=null);
canvas.addEventListener('mouseleave',e=>selectedItem=null);

// --- TRENDING MEMES ---
async function fetchTrendingMemes(){
    const res=await fetch('https://api.imgflip.com/get_memes'); const data=await res.json();
    const container=document.getElementById('meme-container'); container.innerHTML='';
    data.data.memes.slice(0,20).forEach(m=>{
        const div=document.createElement('div'); div.className='card';
        const img=document.createElement('img'); img.src=m.url; div.appendChild(img);
        container.appendChild(div);
    });
}

// --- TRENDING GIFS ---
async function fetchTrendingGIFs(){
    const res=await fetch('/api/gifs'); const data=await res.json();
    const container=document.getElementById('gif-container'); container.innerHTML='';
    data.gifs.forEach(g=>{
        const div=document.createElement('div'); div.className='card';
        const img=document.createElement('img'); img.src=g.url; div.appendChild(img);
        container.appendChild(div);
    });
}
