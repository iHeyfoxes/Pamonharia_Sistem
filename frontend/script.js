const produtos = [
    { id: 1, nome: "Pamonha Tradicional", descricao: "Cremosa, feita com milho verde.", preco: 8, categoria: "pamonhas", emoji: "🌽" },
    { id: 2, nome: "Pamonha com Queijo", descricao: "Pamonha cremosa com queijo.", preco: 10, categoria: "pamonhas", emoji: "🌽" },
    { id: 3, nome: "Pamonha à Moda", descricao: "Com queijo e linguiça.", preco: 12, categoria: "pamonhas", emoji: "🌽" },
    { id: 4, nome: "Bolo de Milho", descricao: "Bolo caseiro de milho.", preco: 7, categoria: "bolos", emoji: "🍰" },
    { id: 5, nome: "Curau", descricao: "Curau cremoso de milho.", preco: 8, categoria: "doces", emoji: "🥣" },
    { id: 6, nome: "Café", descricao: "Café fresquinho.", preco: 5, categoria: "bebidas", emoji: "☕" }
];

// TROQUE PELO WHATSAPP REAL DA PAMONHARIA, somente números com DDI e DDD.
const WHATSAPP_PAMONHARIA = "5500000000000";

let carrinho = [];

function dinheiro(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mostrarProdutos(lista = produtos) {
    const area = document.getElementById("produtos");
    area.innerHTML = lista.map(produto => `
        <article class="produto">
            <div class="produto-imagem">${produto.emoji}</div>
            <div class="produto-info">
                <h3>${produto.nome}</h3>
                <p>${produto.descricao}</p>
                <div class="preco">${dinheiro(produto.preco)}</div>
                <button class="adicionar" onclick="adicionar(${produto.id})">Adicionar ao pedido</button>
            </div>
        </article>
    `).join("");
}

function filtrar(categoria, botao) {
    document.querySelectorAll(".categoria").forEach(item => item.classList.remove("ativa"));
    botao.classList.add("ativa");
    mostrarProdutos(categoria === "todos" ? produtos : produtos.filter(item => item.categoria === categoria));
}

function adicionar(id) {
    const produto = produtos.find(item => item.id === id);
    const item = carrinho.find(item => item.id === id);
    if (item) item.quantidade++;
    else carrinho.push({ ...produto, quantidade: 1 });
    atualizarCarrinho();
}

function alterarQuantidade(id, delta) {
    const item = carrinho.find(item => item.id === id);
    if (!item) return;
    item.quantidade += delta;
    if (item.quantidade <= 0) carrinho = carrinho.filter(item => item.id !== id);
    atualizarCarrinho();
}

function atualizarCarrinho() {
    const contador = carrinho.reduce((total, item) => total + item.quantidade, 0);
    document.getElementById("contador").textContent = contador;
    const area = document.getElementById("itens-carrinho");

    if (carrinho.length === 0) {
        area.innerHTML = "<p>Seu carrinho está vazio.</p>";
    } else {
        area.innerHTML = carrinho.map(item => `
            <div class="item-carrinho">
                <div>
                    <strong>${item.nome}</strong>
                    <div class="controles-qtd">
                        <button onclick="alterarQuantidade(${item.id}, -1)">−</button>
                        <span>${item.quantidade}</span>
                        <button onclick="alterarQuantidade(${item.id}, 1)">+</button>
                    </div>
                </div>
                <strong>${dinheiro(item.preco * item.quantidade)}</strong>
            </div>
        `).join("");
    }

    const total = calcularTotal();
    document.getElementById("total").textContent = dinheiro(total);
    document.getElementById("total-checkout").textContent = dinheiro(total);
}

function calcularTotal() {
    return carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
}

function mostrarCarrinho() {
    atualizarCarrinho();
    document.getElementById("modal").classList.remove("escondido");
}

function fecharCarrinho() {
    document.getElementById("modal").classList.add("escondido");
}

function abrirCheckout() {
    if (carrinho.length === 0) {
        alert("Adicione algum produto ao carrinho primeiro.");
        return;
    }
    fecharCarrinho();
    atualizarCarrinho();
    document.getElementById("checkout").classList.remove("escondido");
}

function fecharCheckout() {
    document.getElementById("checkout").classList.add("escondido");
}

function alternarEndereco() {
    const delivery = document.querySelector('input[name="tipoEntrega"]:checked').value === "delivery";
    document.getElementById("endereco-campos").style.display = delivery ? "grid" : "none";
    document.getElementById("endereco").required = delivery;
}

function enviarPedido(event) {
    event.preventDefault();

    if (WHATSAPP_PAMONHARIA === "5500000000000") {
        alert("Antes de usar o envio pelo WhatsApp, configure o número da pamonharia no arquivo script.js.");
        return;
    }

    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const tipo = document.querySelector('input[name="tipoEntrega"]:checked').value;
    const endereco = document.getElementById("endereco").value.trim();
    const complemento = document.getElementById("complemento").value.trim();
    const observacao = document.getElementById("observacao").value.trim();

    let mensagem = "🌽 *NOVO PEDIDO - PAMONHARIA*\n\n";
    mensagem += `👤 Cliente: ${nome}\n📞 Telefone: ${telefone}\n`;
    mensagem += tipo === "delivery" ? "🛵 Entrega\n" : "🏪 Retirada na loja\n";

    if (tipo === "delivery") {
        mensagem += `📍 Endereço: ${endereco}\n`;
        if (complemento) mensagem += `📌 Complemento: ${complemento}\n`;
    }

    mensagem += "\n*Itens:*\n";
    carrinho.forEach(item => {
        mensagem += `• ${item.quantidade}x ${item.nome} — ${dinheiro(item.preco * item.quantidade)}\n`;
    });

    mensagem += `\n💰 *Total: ${dinheiro(calcularTotal())}*\n`;
    if (observacao) mensagem += `\n📝 Observação: ${observacao}`;

    const url = "https://wa.me/" + WHATSAPP_PAMONHARIA + "?text=" + encodeURIComponent(mensagem);
    window.open(url, "_blank");
}

mostrarProdutos();
atualizarCarrinho();
alternarEndereco();