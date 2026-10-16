export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        let { prompt, imageBase64 } = req.body;
        const apikey = process.env.GEMINI_API_KEY;

        // XỬ LÝ TRIỆT ĐỂ: Tách bỏ tiền tố "data:image/...;base64," nếu plugin có lỡ gửi kèm lên
        if (imageBase64 && imageBase64.includes('base64,')) {
            imageBase64 = imageBase64.split('base64,')[1];
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apikey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: "image/jpeg",
                                    data: imageBase64
                                }
                            }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return res.status(500).json({ error: data.error?.message || "Lỗi từ Google API" });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
