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

        if (!apikey) {
            return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên Vercel" });
        }

        // Làm sạch chuỗi Base64: bỏ toàn bộ tiền tố data URL và ký tự xuống dòng nếu có
        if (imageBase64) {
            if (imageBase64.includes(',')) {
                imageBase64 = imageBase64.split(',')[1];
            }
            imageBase64 = imageBase64.replace(/\s/g, '');
        }

        // Endpoint v1beta tương thích chuẩn với gemini-3.8-flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apikey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt || "Mô tả ảnh này" },
                            {
                                inlineData: {
                                    mimeType: "image/jpeg",
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
            return res.status(response.status).json({ error: data.error?.message || "Lỗi từ Google API" });
        }

        // Bóc tách câu trả lời của AI gửi về cho Photoshop
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi";
        res.status(200).json({ result: aiText, raw: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
