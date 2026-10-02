# GastoCerto — outcomes

- [ ] **Painel mensal objetivo:** o app deve mostrar total do mês, gasto por categoria com barras e percentuais, comparação com o mês anterior, orçamento por categoria com alerta de estouro, visão clara de “sobrou ou faltou” considerando receitas menos despesas, e fatura do cartão de crédito com fatura fechada/aberta e melhor dia de compra.
- [ ] **Lançamentos manuais completos:** o app deve permitir cadastrar despesas e receitas com valor, data, descrição, categoria e forma de pagamento (crédito, débito, pix, dinheiro), editar e excluir lançamentos e marcar parcelamento no cartão de crédito.
- [ ] **Integração C6 via Open Finance:** o app deve preparar conexão com o banco C6 usando Open Finance por um agregador regulado (Pluggy), mantendo client_id/client_secret apenas no servidor, oferecendo sincronização automática/periódica, botão “Sincronizar agora” e estado explícito quando as credenciais ainda não estiverem configuradas.
- [ ] **Alternativas de dados:** o app deve oferecer modo demonstração com dados fictícios e importação de extrato OFX/CSV exportado do app do C6 quando a conexão Open Finance não estiver disponível.
- [ ] **Alertas de novas compras:** o app deve sinalizar quando uma nova compra no cartão de crédito for detectada na sincronização e informar quanto isso representa do orçamento da categoria.
- [ ] **Metas e diagnóstico:** o app deve permitir definir renda mensal e limites por categoria e exibir diagnóstico textual simples, por exemplo “você gastou X% a mais em Alimentação neste mês”.
- [ ] **Experiência mobile e PC:** o app deve priorizar celular em retrato e uso com uma mão, usar navegação por abas na parte inferior, tema escuro elegante, números grandes/legíveis e funcionar também no navegador para PC.
- [ ] **Persistência:** os dados devem sobreviver ao fechamento do app usando persistência local e ter estrutura de backend/banco gerenciado para sincronização e dados duráveis por usuário.
