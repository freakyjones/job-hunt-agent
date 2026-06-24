async function testEnv() {
    console.log("Checking Environment Variables...");

    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
    if (!process.env.SUPABASE_URL) throw new Error("SUPABASE_URL missing");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");

    console.log("✅ Basic variables exist.");

    try {
        console.log("Testing Supabase Connection...");
        const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
            method: 'GET',
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        if (!res.ok) throw new Error(`Supabase returned ${res.status}`);
        console.log("✅ Supabase connected successfully!");
    } catch (e) {
        console.error("❌ Supabase Error:", e.message);
    }

    try {
        console.log("Testing Gemini Connection...");
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Respond with the word 'OK'" }] }]
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        console.log("✅ Gemini connected successfully!");
    } catch (e) {
        console.error("❌ Gemini Error:", e.message);
    }
}

testEnv();
