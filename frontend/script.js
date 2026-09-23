const SUPABASE_URL = "https://ayzfnqgffuqchzfrbixq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_f9y_GR3y7y9XpqDhwqwKjA_X8N1rqZF";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let configuracoes = { business_name: "Pamonharia", whatsapp_number: "", delivery_fee: 0, minimum_order: 0 };
const CHAVE_PEDIDOS = "pamonharia_pedidos";
let produtos = [];
let carrinho = [];

const emojis = { pamonhas:"🌽", bolos:"🍰", doces:"🥣", bebidas:"☕" };

async function carregarConfiguracoes() {\n    const { data, error } = await supabaseClient.from("pamonharia_settings").select("business_name,whatsapp_number,delivery_fee,minimum_order").eq("id",1).single();\n    if (!error && data) configuracoes = data;\n}\n\nfunction dinheiro(valor) {
    return Number(valor).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
}

async function carregarProdutos() {
    const {data, error} = await supabaseClient
        .from("products")
        .select("id,name,description,price,image_url,category_id,categories!inner(slug)")
        .eq("active", true)
        .order("name");

    if (error) {
        console.error("Erro ao carregar produtos:", error);
        document.getElementById("produtos").innerHTML = "<p>Não foi possível carregar o cardápio.</p>";
        return;
    }

    produtos = data.map(item => ({
        id:item.id, nome:item.name, descricao:item.description||"", preco:Number(item.price),
        categoria:item.categories.slug, imagem:item.image_url, emoji:emojis[item.categories.slug]||"🌽"
    }));
    mostrarProdutos();
}

function mostrarProdutos(lista=produtos) {
    const area=document.getElementById("produtos");
    if (!lista.length) { area.innerHTML="<p>Nenhum produto disponível nesta categoria.</p>"; return; }

    area.innerHTML=lista.map(produto=>`
        <article class="produto">
            <div class="produto-imagem">${produto.imagem ? `<img src="${produto.imagem}" alt="${produto.nome}">` : produto.emoji}</div>
            <div class="produto-info">
                <h3>${produto.nome}</h3><p>${produto.descricao}</p>
                <div class="preco">${dinheiro(produto.preco)}</div>
                <button class="adicionar" onclick="adicionar('${produto.id}')">Adicionar ao pedido</button>
            </div>
        </article>`).join("");
}

function filtrar(categoria,botao) {
    document.querySelectorAll(".categoria").forEach(item=>item.classList.remove("ativa"));
    botao.classList.add("ativa");
    mostrarProdutos(categoria==="todos" ? produtos : produtos.filter(item=>item.categoria===categoria));
}

function adicionar(id) {
    const produto=produtos.find(item=>String(item.id)===String(id));
    if(!produto)return;
    const item=carrinho.find(item=>String(item.id)===String(id));
    if(item)item.quantidade++; else carrinho.push({...produto,quantidade:1});
    atualizarCarrinho();
}

function alterarQuantidade(id,delta) {
    const item=carrinho.find(item=>String(item.id)===String(id));
    if(!item)return;
    item.quantidade+=delta;
    if(item.quantidade<=0)carrinho=carrinho.filter(item=>String(item.id)!==String(id));
    atualizarCarrinho();
}

function atualizarCarrinho() {
    document.getElementById("contador").textContent=carrinho.reduce((t,i)=>t+i.quantidade,0);
    const area=document.getElementById("itens-carrinho");
    area.innerHTML=carrinho.length ? carrinho.map(item=>`
        <div class="item-carrinho"><div><strong>${item.nome}</strong>
        <div class="controles-qtd"><button onclick="alterarQuantidade('${item.id}',-1)">−</button>
        <span>${item.quantidade}</span><button onclick="alterarQuantidade('${item.id}',1)">+</button></div></div>
        <strong>${dinheiro(item.preco*item.quantidade)}</strong></div>`).join("") : "<p>Seu carrinho está vazio.</p>";
    const total=calcularTotal();
    document.getElementById("total").textContent=dinheiro(total);
    document.getElementById("total-checkout").textContent=dinheiro(total);
}

function calcularTotal(){return carrinho.reduce((s,i)=>s+i.preco*i.quantidade,0);}
function mostrarCarrinho(){atualizarCarrinho();document.getElementById("modal").classList.remove("escondido");}
function fecharCarrinho(){document.getElementById("modal").classList.add("escondido");}
function abrirCheckout(){if(!carrinho.length){alert("Adicione algum produto ao carrinho primeiro.");return;}fecharCarrinho();document.getElementById("checkout").classList.remove("escondido");}
function fecharCheckout(){document.getElementById("checkout").classList.add("escondido");}
function alternarEndereco(){const delivery=document.querySelector('input[name="tipoEntrega"]:checked').value==="delivery";document.getElementById("endereco-campos").style.display=delivery?"grid":"none";document.getElementById("endereco").required=delivery;}

function salvarPedidoLocal(pedido){
    const pedidos=JSON.parse(localStorage.getItem(CHAVE_PEDIDOS)||"[]");
    pedidos.push(pedido); localStorage.setItem(CHAVE_PEDIDOS,JSON.stringify(pedidos));
}

async function salvarPedidoNoSupabase(nome,telefone,tipo,endereco,complemento,observacao,total) {
    // Geramos os IDs no navegador para não precisar de SELECT após o INSERT.
    // Isso permite que o cliente anônimo crie o pedido respeitando o RLS.
    const customerId = crypto.randomUUID();
    const orderId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const {error:clienteError}=await supabaseClient.from("customers").insert({
        id:customerId, name:nome, phone:telefone
    });
    if(clienteError)throw clienteError;

    const {error:pedidoError}=await supabaseClient.from("orders").insert({
        id:orderId, customer_id:customerId, order_type:tipo,
        address:tipo==="delivery"?endereco:null,
        complement:tipo==="delivery"?complemento||null:null,
        observation:observacao||null, total
    });
    if(pedidoError)throw pedidoError;

    const itens=carrinho.map(item=>({
        order_id:orderId, product_id:item.id, product_name:item.nome,
        unit_price:item.preco, quantity:item.quantidade,
        subtotal:item.preco*item.quantidade
    }));
    const {error:itensError}=await supabaseClient.from("order_items").insert(itens);
    if(itensError)throw itensError;

    return {id:orderId, created_at:createdAt, status:"pending"};
}

async function enviarPedido(event) {
    event.preventDefault();
    const nome=document.getElementById("nome").value.trim();
    const telefone=document.getElementById("telefone").value.trim();
    const tipo=document.querySelector('input[name="tipoEntrega"]:checked').value;
    const endereco=document.getElementById("endereco").value.trim();
    const complemento=document.getElementById("complemento").value.trim();
    const observacao=document.getElementById("observacao").value.trim();
    const total=calcularTotal();

    const pedidoLocal={id:Date.now(),data:new Date().toLocaleString("pt-BR"),status:"pendente",
        tipo:tipo==="delivery"?"delivery":"retirada",cliente:{nome,telefone,endereco,complemento},
        itens:carrinho.map(item=>({id:item.id,nome:item.nome,preco:item.preco,quantidade:item.quantidade})),total,observacao};

    try {
        const pedidoBanco=await salvarPedidoNoSupabase(nome,telefone,tipo,endereco,complemento,observacao,total);
        pedidoLocal.id=pedidoBanco.id;
        pedidoLocal.data=new Date(pedidoBanco.created_at).toLocaleString("pt-BR");
        salvarPedidoLocal(pedidoLocal);
    } catch(error) {
        console.error("Erro ao salvar pedido no Supabase:",error);
        salvarPedidoLocal(pedidoLocal);
        alert("O pedido foi salvo neste navegador, mas não foi possível sincronizar com o banco.");
    }

    let mensagem="🌽 *NOVO PEDIDO - PAMONHARIA*\n\n";
    mensagem+=`👤 Cliente: ${nome}\n📞 Telefone: ${telefone}\n`;
    mensagem+=tipo==="delivery"?"🛵 Entrega\n":"🏪 Retirada na loja\n";
    if(tipo==="delivery"){mensagem+=`📍 Endereço: ${endereco}\n`;if(complemento)mensagem+=`📌 Complemento: ${complemento}\n`;}
    mensagem+="\n*Itens:*\n";
    carrinho.forEach(item=>mensagem+=`• ${item.quantidade}x ${item.nome} — ${dinheiro(item.preco*item.quantidade)}\n`);
    mensagem+=`\n💰 *Total: ${dinheiro(total)}*\n`;
    if(observacao)mensagem+=`\n📝 Observação: ${observacao}`;

    if(WHATSAPP_PAMONHARIA!=="5500000000000")window.open("https://wa.me/"+WHATSAPP_PAMONHARIA+"?text="+encodeURIComponent(mensagem),"_blank");
    else alert("Pedido registrado no banco! Configure o WhatsApp da pamonharia para enviar também pelo WhatsApp.");

    carrinho=[];atualizarCarrinho();document.getElementById("form-pedido").reset();alternarEndereco();fecharCheckout();
}

carregarProdutos();carregarConfiguracoes();atualizarCarrinho();alternarEndereco();