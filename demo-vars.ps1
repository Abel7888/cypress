$PROXY = "https://cypress-production-1cc5.up.railway.app"
$TENANT_ID = "6f96c565-2284-4092-93c4-62252a1c1d59"
$ADMIN_KEY = "lMNUO5f2xEAmxq8lXA9ODmCi-pxCr-9hL99fyw3VlWw"
$ADMIN = @{'Authorization'="Bearer $ADMIN_KEY"; 'Content-Type'='application/json'}
$SARAH = "tg-d06616108a81726611cb49c0ef73f8c96f4eba3b15806e43"
$h_sarah = @{'Authorization'="Bearer $SARAH"; 'Content-Type'='application/json'; 'X-Agent-ID'='Sarah (Engineering)'}
$b1 = '{"model":"gpt-4o","messages":[{"role":"user","content":"Write a detailed project plan for a product launch"}],"max_tokens":500}'
$b2 = '{"model":"gpt-4o","messages":[{"role":"user","content":"Analyze our competitive landscape in SaaS"}],"max_tokens":500}'
$b3 = '{"model":"gpt-4o","messages":[{"role":"user","content":"Write a full marketing strategy for Q3"}],"max_tokens":500}'
