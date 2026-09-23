const produtos = [
    {
        id: 1,
        nome: "Pamonha Tradicional",
        descricao: "Cremosa, feita com milho verde.",
        preco: 8,
        categoria: "pamonhas",
        emoji: "🌽"
    },
    {
        id: 2,
        nome: "Pamonha com Queijo",
        descricao: "Pamonha cremosa com queijo.",
        preco: 10,
        categoria: "pamonhas",
        emoji: "🌽"
    },
    {
        id: 3,
        nome: "Pamonha à Moda",
        descricao: "Com queijo e linguiça.",
        preco: 12,
        categoria: "pamonhas",
        emoji: "🌽"
    },
    {
        id: 4,
        nome: "Bolo de Milho",
        descricao: "Bolo caseiro de milho.",
        preco: 7,
        categoria: "bolos",
        emoji: "🍰"
    },
    {
        id: 5,
        nome: "Curau",
        descricao: "Curau cremoso de milho.",
        preco: 8,
        categoria: "doces",
        emoji: "🥣"
    },
    {
        id: 6,
        nome: "Café",
        descricao: "Café fresquinho.",
        preco: 5,
        categoria: "bebidas",
        emoji: "☕"
    }
];

let carrinho = [];

function dinheiro(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
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
                <button class="adicionar" onclick="adicionar(${produto.id})">
                    Adicionar ao pedido
                </button>
            </div>
        </article>
    `).join("");
}

function filtrar(categoria, botao) {
    document.querySelectorAll(".categoria").forEach(item => {
        item.classList.remove("ativa");
    });

    botao.classList.add("ativa");

    if (categoria === "todos") {
        mostrarProdutos();
    } else {
        mostrarProdutos(produtos.filter(item => item.categoria === categoria));
    }
}

function adicionar(id) {
    const produto = produtos.find(item => item.id === id);
    const item = carrinho.find(item => item.id === id);

    if (item) {
        item.quantidade++;
    } else {
        carrinho.push({
            ...produto,
            quantidade: 1
        });
    }

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
                    <strong>${item.nome}</strong><br>
                    ${item.quantidade}x ${dinheiro(item.preco)}
                </div>
                <strong>${dinheiro(item.preco * item.quantidade)}</strong>
            </div>
        `).join("");
    }

    const total = carrinho.reduce(
        (soma, item) => soma + item.preco * item.quantidade,
        0
    );

    document.getElementById("total").textContent = dinheiro(total);
}

function mostrarCarrinho() {
    atualizarCarrinho();
    document.getElementById("modal").classList.remove("escondido");
}

function fecharCarrinho() {
    document.getElementById("modal").classList.add("escondido");
}

function finalizarPedido() {
    if (carrinho.length === 0) {
        alert("Adicione algum produto ao carrinho primeiro.");
        return;
    }

    alert("Próxima etapa: vamos criar o checkout e o envio do pedido!");
}

mostrarProdutos();
atualizarCarrinho();
