const CHAVE="pamonharia_pedidos";
let filtroAtual="todos";

function dinheiro(v){return Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function pedidos(){return JSON.parse(localStorage.getItem(CHAVE)||"[]");}
function salvar(lista){localStorage.setItem(CHAVE,JSON.stringify(lista));render();}

function render(){
 const lista=pedidos();
 document.getElementById("total-pedidos").textContent=lista.length;
 document.getElementById("pendentes").textContent=lista.filter(p=>p.status==="pendente").length;
 document.getElementById("faturamento").textContent=dinheiro(lista.reduce((s,p)=>s+Number(p.total||0),0));
 const exibidos=filtroAtual==="todos"?lista:lista.filter(p=>p.status===filtroAtual);
 const area=document.getElementById("pedidos");
 if(!exibidos.length){area.innerHTML='<div class="vazio">Nenhum pedido encontrado.</div>';return;}
 area.innerHTML=exibidos.slice().reverse().map(p=>`
 <article class="pedido">
  <div class="pedido-topo"><div><strong>Pedido #${p.id}</strong><small>${p.data}</small></div><span class="status ${p.status}">${nomeStatus(p.status)}</span></div>
  <div class="cliente"><strong>${escapeHtml(p.cliente?.nome||"Cliente")}</strong><span>📞 ${escapeHtml(p.cliente?.telefone||"")}</span><span>${p.tipo==="delivery"?"🛵 Entrega":"🏪 Retirada"}</span></div>
  ${p.tipo==="delivery"?`<p>📍 ${escapeHtml(p.cliente?.endereco||"")} ${escapeHtml(p.cliente?.complemento||"")}</p>`:""}
  <div class="itens">${(p.itens||[]).map(i=>`<div><span>${i.quantidade}x ${escapeHtml(i.nome)}</span><strong>${dinheiro(i.preco*i.quantidade)}</strong></div>`).join("")}</div>
  ${p.observacao?`<p class="obs">📝 ${escapeHtml(p.observacao)}</p>`:""}
  <div class="pedido-final"><strong>Total: ${dinheiro(p.total)}</strong><select onchange="alterarStatus('${p.id}',this.value)">
   <option value="pendente" ${p.status==="pendente"?"selected":""}>Pendente</option>
   <option value="preparando" ${p.status==="preparando"?"selected":""}>Preparando</option>
   <option value="pronto" ${p.status==="pronto"?"selected":""}>Pronto</option>
   <option value="finalizado" ${p.status==="finalizado"?"selected":""}>Finalizado</option>
  </select></div>
 </article>`).join("");
}
function nomeStatus(s){return {pendente:"Pendente",preparando:"Preparando",pronto:"Pronto",finalizado:"Finalizado"}[s]||s;}
function alterarStatus(id,status){const lista=pedidos();const p=lista.find(x=>String(x.id)===String(id));if(p){p.status=status;salvar(lista);}}
function filtrarPedidos(f,b){filtroAtual=f;document.querySelectorAll(".filtro").forEach(x=>x.classList.remove("ativo"));b.classList.add("ativo");render();}
function limparPedidos(){if(confirm("Tem certeza que deseja apagar todos os pedidos deste navegador?")){localStorage.removeItem(CHAVE);render();}}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
render();