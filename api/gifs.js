import fetch from "node-fetch";

const GIPHY_API_KEY = process.env.GIPHY_API_KEY; // Vercel env var

export default async function handler(req,res){
    try{
        const response=await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`);
        const data=await response.json();
        const gifs=data.data.map(g=>({id:g.id,url:g.images.fixed_width.url,title:g.title}));
        res.status(200).json({gifs});
    }catch(err){
        console.error(err); res.status(500).json({gifs:[]});
    }
}
