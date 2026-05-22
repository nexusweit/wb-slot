export default async function handler(req, res) {
    // Берем настройки из переменных окружения Vercel или используем значения по умолчанию
    const config = {
        api_key: process.env.API_KEY || '', 
        offer_id: process.env.OFFER_ID || '0',
        stream: process.env.STREAM || '',
        preland: process.env.PRELAND === 'true', // преобразуем строку "true" в булево значение
        api_domain: process.env.API_DOMAIN || 'uqiaole.info',
        fallback_ip: '45.128.150.36'
    };

    const { subid } = req.query;

    // Проверка наличия API ключа
    if (!config.api_key) {
        return res.status(500).json({ success: false, error: 'API_KEY is not set in Vercel Environment Variables' });
    }

    const requestData = {
        offer_id: parseInt(config.offer_id),
        api_key: config.api_key,
        preland: config.preland,
    };

    if (config.stream) {
        requestData.stream = config.stream;
    }

    const apiUrl = `https://${config.api_domain}/api/v1/getStreamURL`;

    // Функция для редиректа с пробросом subid
    const redirectWithSubid = (baseUrl) => {
        try {
            const url = new URL(baseUrl);
            if (subid) {
                url.searchParams.set('subid', subid);
            }
            res.status(302).setHeader('Location', url.toString());
            res.end();
        } catch (e) {
            // Если URL от API пришел кривой, пробуем просто склеить строкой
            let finalUrl = baseUrl;
            if (subid) {
                finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'subid=' + encodeURIComponent(subid);
            }
            res.status(302).setHeader('Location', finalUrl);
            res.end();
        }
    };

    async function makeRequest(url) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
            signal: AbortSignal.timeout(8000) // Таймаут 8 сек
        });
        return await response.json();
    }

    try {
        let result;
        try {
            // 1 попытка по домену
            result = await makeRequest(apiUrl);
        } catch (e) {
            console.error('Primary domain failed, trying fallback IP...');
            // 2 попытка по IP (fallback)
            const fallbackUrl = `https://${config.fallback_ip}/api/v1/getStreamURL`;
            result = await makeRequest(fallbackUrl);
        }

        if (result && result.url) {
            return redirectWithSubid(result.url);
        } else {
            return res.status(500).json({ 
                success: false, 
                error: 'No URL in API response', 
                details: result 
            });
        }
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: 'API request failed: ' + error.message 
        });
    }
}