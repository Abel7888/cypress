$PROXY     = "https://cypress-production-1cc5.up.railway.app"
$TENANT_ID = "6f96c565-2284-4092-93c4-62252a1c1d59"
$ADMIN_KEY = "lMNUO5f2xEAmxq8lXA9ODmCi-pxCr-9hL99fyw3VlWw"
$ADMIN     = @{'Authorization'="Bearer $ADMIN_KEY"; 'Content-Type'='application/json'}

$SARAH  = "tg-437fd93f03009f389f1c9394afadd583946a9b5c05c64077"
$JAMIE  = "tg-9587f9fa1cbc7091e59c3c46dd5d541931b148916bd6c2f4"
$MARCUS = "tg-532afe26d2cdd4f6428cc2bfe5a8ade9cc998acc121aeaf8"

$h_sarah  = @{'Authorization'="Bearer $SARAH";  'Content-Type'='application/json'; 'X-Agent-ID'='Sarah (Engineering)'}
$h_jamie  = @{'Authorization'="Bearer $JAMIE";  'Content-Type'='application/json'; 'X-Agent-ID'='Jamie (Blocked)'}
$h_marcus = @{'Authorization'="Bearer $MARCUS"; 'Content-Type'='application/json'; 'X-Agent-ID'='Marcus (Sales)'}

$b1 = '{"model":"gpt-4o","messages":[{"role":"user","content":"Write a detailed project plan for a product launch"}],"max_tokens":500}'
$b2 = '{"model":"gpt-4o","messages":[{"role":"user","content":"Analyze our competitive landscape in SaaS"}],"max_tokens":500}'
$b3 = '{"model":"gpt-4o","messages":[{"role":"user","content":"Write a full marketing strategy for Q3"}],"max_tokens":500}'
$claude = '{"model":"claude-sonnet-4-6","messages":[{"role":"user","content":"What is machine learning?"}],"max_tokens":100}'
$gpt    = '{"model":"gpt-4o","messages":[{"role":"user","content":"What is machine learning?"}],"max_tokens":100}'
