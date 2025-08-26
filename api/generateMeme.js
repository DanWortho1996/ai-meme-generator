import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const { template_id, top, bottom } = req.body;

    const IMGFLIP_USERNAME = process.env.IMGFLIP_USERNAME;
    const IMGFLIP_PASSWORD = process.env.IMGFLIP_PASSWORD;

    const form = new URLSearchParams();
    form.append('template_id', template_id);
    form.append('username', IMGFLIP_USERNAME);
    form.append('password', IMGFLIP_PASSWORD);
    form.append('text0', top);
    form.append('text1', bottom);

    const response = await fetch('https://api.imgflip.com/caption_image', {
      method: 'POST',
      body: form
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
