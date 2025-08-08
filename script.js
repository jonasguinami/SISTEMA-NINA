document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DA APLICAÇÃO ---
    let produtos = JSON.parse(localStorage.getItem('produtos')) || [];
    let vendas = JSON.parse(localStorage.getItem('vendas')) || [];
    let itensVendaAtual = [];
    let idProdutoEmEdicao = null;
    let dataAtualVisualizada = new Date();
    let periodoRelatorioSelecionado = 'dia';

    // --- REFERÊNCIAS AO DOM ---
    const dataDisplay = document.getElementById('data-display');
    const listaProdutosEl = document.getElementById('lista-produtos');
    const listaFiadoEl = document.getElementById('lista-fiado');
    const listaVendasDiaEl = document.getElementById('lista-vendas-dia');
    const abasRelatorio = document.querySelector('.abas-relatorio');
    const modalProduto = document.getElementById('modal-produto');
    const modalVenda = document.getElementById('modal-venda');
    const formProduto = document.getElementById('form-produto');
    const formVenda = document.getElementById('form-venda');
    
    // Funções de salvamento
    const salvarProdutos = () => localStorage.setItem('produtos', JSON.stringify(produtos));
    const salvarVendas = () => localStorage.setItem('vendas', JSON.stringify(vendas));

    // --- LÓGICA DE NAVEGAÇÃO DE DATA ---
    const formatarData = (data) => {
        const hoje = new Date();
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        if (data.toDateString() === hoje.toDateString()) return 'Hoje';
        if (data.toDateString() === ontem.toDateString()) return 'Ontem';
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    const atualizarDisplayData = () => {
        dataDisplay.textContent = formatarData(dataAtualVisualizada);
        atualizarInterfaceCompleta();
    };

    // --- LÓGICA DE PRODUTOS ---
    const calcularCustoUnitario = () => {
        const custoPacote = parseFloat(document.getElementById('custo-pacote').value) || 0;
        const itensPorPacote = parseInt(document.getElementById('itens-por-pacote').value) || 1;
        if (itensPorPacote <= 0) return;
        const custoUnitario = custoPacote / itensPorPacote;
        document.getElementById('custo-unitario').value = isNaN(custoUnitario) ? '' : `R$ ${custoUnitario.toFixed(2)}`;
    };

    const fecharModalProduto = () => {
        idProdutoEmEdicao = null;
        modalProduto.style.display = 'none';
    };

    const abrirModalProduto = (paraEditar = false) => {
        formProduto.reset();
        document.getElementById('custo-unitario').value = '';
        if (paraEditar) {
            document.getElementById('modal-produto-titulo').textContent = 'Editar Produto';
            const produto = produtos.find(p => p.id === idProdutoEmEdicao);
            if (produto) {
                document.getElementById('nome-produto').value = produto.nome;
                document.getElementById('preco-venda').value = produto.preco;
                document.getElementById('quantidade-estoque').value = produto.quantidadeEstoque;
                document.getElementById('custo-unitario').value = `R$ ${(produto.custoUnitario || 0).toFixed(2)}`;
                document.getElementById('itens-por-pacote').value = 1;
                document.getElementById('custo-pacote').value = (produto.custoUnitario || 0).toFixed(2);
            }
        } else {
            idProdutoEmEdicao = null;
            document.getElementById('modal-produto-titulo').textContent = 'Cadastrar Novo Produto';
        }
        modalProduto.style.display = 'flex';
    };
    
    const salvarProdutoHandler = (e) => {
        e.preventDefault();
        const custoPacote = parseFloat(document.getElementById('custo-pacote').value);
        const itensPorPacote = parseInt(document.getElementById('itens-por-pacote').value);
        if (isNaN(custoPacote) || isNaN(itensPorPacote) || itensPorPacote <= 0) {
            alert('Verifique os valores de Custo do Pacote e Itens por Pacote.');
            return;
        }
        const custoUnitario = custoPacote / itensPorPacote;
        const produtoData = {
            nome: document.getElementById('nome-produto').value,
            preco: parseFloat(document.getElementById('preco-venda').value),
            quantidadeEstoque: parseInt(document.getElementById('quantidade-estoque').value),
            custoUnitario: custoUnitario
        };
        if (!produtoData.nome || isNaN(produtoData.preco) || isNaN(produtoData.quantidadeEstoque)) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
        if (idProdutoEmEdicao) {
            const index = produtos.findIndex(p => p.id === idProdutoEmEdicao);
            if (index !== -1) produtos[index] = { ...produtos[index], ...produtoData };
        } else {
            produtos.push({ id: Date.now(), ...produtoData });
        }
        salvarProdutos();
        renderizarProdutos();
        fecharModalProduto();
    };

    const renderizarProdutos = () => {
        listaProdutosEl.innerHTML = produtos.length ? '' : '<p>Nenhum produto cadastrado.</p>';
        produtos.forEach(p => {
            const preco = p.preco || 0;
            const custoUnitario = p.custoUnitario || 0;
            listaProdutosEl.innerHTML += `
                <div class="produto-item">
                    <div class="info">
                        <span>${p.nome}</span><br>
                        <small>Preço: R$ ${preco.toFixed(2)} | Custo Un.: R$ ${custoUnitario.toFixed(2)}</small><br>
                        <small class="estoque">Estoque: ${p.quantidadeEstoque || 0}</small>
                    </div>
                    <div class="acoes">
                        <button class="btn-editar-produto" data-id="${p.id}" title="Editar">✏️</button>
                        <button class="btn-excluir-produto" data-id="${p.id}" title="Excluir">🗑️</button>
                    </div>
                </div>`;
        });
    };
    
    // --- LÓGICA DE VENDA ---
    const atualizarResumoVenda = () => {
        let total = itensVendaAtual.reduce((acc, item) => acc + item.precoTotal, 0);
        document.getElementById('total-venda-atual').textContent = `Total: R$ ${total.toFixed(2)}`;
        const pagoDinheiro = parseFloat(document.getElementById('pagamento-dinheiro').value) || 0;
        const pagoPix = parseFloat(document.getElementById('pagamento-pix').value) || 0;
        const totalPago = pagoDinheiro + pagoPix;
        const restante = total - totalPago;
        document.getElementById('total-pago').textContent = `R$ ${totalPago.toFixed(2)}`;
        document.getElementById('valor-restante').textContent = `R$ ${restante.toFixed(2)}`;
        const fiadoInput = document.getElementById('pagamento-fiado');
        fiadoInput.value = restante > 0.005 ? restante.toFixed(2) : '0.00';
        document.getElementById('cliente-fiado').disabled = restante <= 0.005;
        document.getElementById('cliente-fiado').required = restante > 0.005;
    };

    const renderizarItensVenda = () => {
        document.getElementById('itens-selecionados-venda').innerHTML = itensVendaAtual.length ? '' : '<p>Nenhum item adicionado.</p>';
        itensVendaAtual.forEach((item) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `item-venda ${item.isPromo ? 'promocao' : ''}`;
            itemDiv.innerHTML = `<span>${item.nome} (Qtd: ${item.quantidade})</span><strong>R$ ${item.precoTotal.toFixed(2)}</strong>`;
            document.getElementById('itens-selecionados-venda').appendChild(itemDiv);
        });
        atualizarResumoVenda();
    };

    const abrirModalVenda = () => {
        itensVendaAtual = [];
        formVenda.reset();
        const selectProdutoVenda = document.getElementById('selecionar-produto-venda');
        selectProdutoVenda.innerHTML = '<option value="">-- Selecione um produto --</option>';
        produtos.filter(p => p.quantidadeEstoque > 0).forEach(p => {
            selectProdutoVenda.innerHTML += `<option value="${p.id}">${p.nome} (Estoque: ${p.quantidadeEstoque})</option>`;
        });
        renderizarItensVenda();
        modalVenda.style.display = 'flex';
    };

    const salvarVendaHandler = (e) => {
        e.preventDefault();
        if (itensVendaAtual.length === 0) { alert('Adicione itens à venda.'); return; }
        const totalVenda = itensVendaAtual.reduce((acc, item) => acc + item.precoTotal, 0);
        const pagamentos = [
            { metodo: 'dinheiro', valor: parseFloat(document.getElementById('pagamento-dinheiro').value) || 0 },
            { metodo: 'pix', valor: parseFloat(document.getElementById('pagamento-pix').value) || 0 }
        ];
        const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
        const valorFiado = totalVenda - totalPago;
        const clienteFiado = document.getElementById('cliente-fiado').value;
        if (valorFiado > 0.005 && !clienteFiado) { alert('É necessário informar o nome do cliente para vendas fiado.'); return; }
        for(const item of itensVendaAtual) {
            if(!item.isPromo){
                const produtoEstoque = produtos.find(p => p.id === item.id);
                if(produtoEstoque) produtoEstoque.quantidadeEstoque -= item.quantidade;
            }
        }
        salvarProdutos();
        const novaVenda = {
            id: Date.now(), data: dataAtualVisualizada.toISOString(), itens: itensVendaAtual,
            pagamentos: pagamentos.filter(p => p.valor > 0),
            fiado: valorFiado > 0.005 ? { cliente: clienteFiado, valor: valorFiado, quitado: false } : null,
            total: totalVenda
        };
        vendas.push(novaVenda);
        salvarVendas();
        alert('Venda registrada com sucesso!');
        modalVenda.style.display = 'none';
        atualizarInterfaceCompleta();
    };

    // --- LÓGICA DE FIADO ---
    const renderizarFiado = () => {
        listaFiadoEl.innerHTML = '';
        const contasAbertas = vendas.filter(v => v.fiado && !v.fiado.quitado).sort((a,b) => new Date(a.data) - new Date(b.data));
        if (contasAbertas.length === 0) { listaFiadoEl.innerHTML = '<p>Nenhuma conta pendente.</p>'; return; }
        contasAbertas.forEach(venda => {
            listaFiadoEl.innerHTML += `
                <div class="fiado-item">
                    <div class="info">
                        <span class="cliente">${venda.fiado.cliente}</span>
                        <span class="valor">R$ ${venda.fiado.valor.toFixed(2)}</span>
                        <small>${new Date(venda.data).toLocaleDateString('pt-BR')}</small>
                    </div>
                    <button class="btn btn-receber" data-venda-id="${venda.id}">Receber Pagamento</button>
                </div>`;
        });
    };

    // --- LÓGICA DE RELATÓRIOS ---
    const getVendasDoPeriodo = (dataReferencia, periodo) => {
        const ano = dataReferencia.getFullYear();
        const mes = dataReferencia.getMonth();
        const dia = dataReferencia.getDate();
        if (periodo === 'dia') return vendas.filter(v => new Date(v.data).toDateString() === dataReferencia.toDateString());
        if (periodo === 'semana') {
            const primeiroDiaSemana = new Date(dataReferencia);
            primeiroDiaSemana.setDate(dia - dataReferencia.getDay());
            primeiroDiaSemana.setHours(0,0,0,0);
            const ultimoDiaSemana = new Date(primeiroDiaSemana);
            ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6);
            ultimoDiaSemana.setHours(23,59,59,999);
            return vendas.filter(v => new Date(v.data) >= primeiroDiaSemana && new Date(v.data) <= ultimoDiaSemana);
        }
        if (periodo === 'mes') return vendas.filter(v => new Date(v.data).getFullYear() === ano && new Date(v.data).getMonth() === mes);
        return [];
    };
    
    const baixarArquivo = (nomeArquivo, conteudo) => {
        const a = document.createElement('a');
        const blob = new Blob([conteudo], {type: 'text/plain;charset=utf-8'});
        a.href = URL.createObjectURL(blob);
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    };

    const gerarRelatorioTxt = () => {
        const vendasPeriodo = getVendasDoPeriodo(dataAtualVisualizada, periodoRelatorioSelecionado);
        let conteudo = `RELATÓRIO DE VENDAS\nPeríodo: ${periodoRelatorioSelecionado.toUpperCase()}\n\n`;
        if(vendasPeriodo.length === 0) {
            conteudo += "Nenhuma venda registrada neste período.";
            return conteudo;
        }
        vendasPeriodo.forEach(venda => {
            // ** CORREÇÃO AQUI: Se venda.total não existir, usa 0 **
            const totalVenda = venda.total || 0;
            conteudo += `Venda ID: ${venda.id} | Data: ${new Date(venda.data).toLocaleString('pt-BR')} | Total: R$ ${totalVenda.toFixed(2)}\n`;
            if (Array.isArray(venda.itens)) {
                venda.itens.forEach(item => {
                    conteudo += `  - Item: ${item.nome} (Qtd: ${item.quantidade}) - R$ ${(item.precoTotal || 0).toFixed(2)}\n`;
                });
            }
            conteudo += "----------------------------------------\n";
        });
        return conteudo;
    };

    const gerarRelatorioCsv = () => {
        const vendasPeriodo = getVendasDoPeriodo(dataAtualVisualizada, periodoRelatorioSelecionado);
        let conteudo = "ID Venda,Data,Hora,Nome Item,Quantidade,Preco Total Item\n";
        if (vendasPeriodo.length === 0) return conteudo;
        vendasPeriodo.forEach(venda => {
            const dataVenda = new Date(venda.data);
            const dataStr = dataVenda.toLocaleDateString('pt-BR');
            const horaStr = dataVenda.toLocaleTimeString('pt-BR');
            if (Array.isArray(venda.itens)) {
                venda.itens.forEach(item => {
                    conteudo += `${venda.id},${dataStr},${horaStr},"${item.nome}",${item.quantidade || 1},${(item.precoTotal || 0).toFixed(2)}\n`;
                });
            }
        });
        return conteudo;
    };
    
    // --- ATUALIZAÇÃO GERAL E INICIALIZAÇÃO ---
    const renderizarVendasDoDia = (vendasDia) => {
        listaVendasDiaEl.innerHTML = '';
        if (!vendasDia || vendasDia.length === 0) {
            listaVendasDiaEl.innerHTML = '<p>Nenhuma venda registrada neste dia.</p>';
            return;
        }
        // Inverte a ordem para mostrar as mais recentes primeiro
        vendasDia.slice().reverse().forEach(venda => {
            const itensDesc = Array.isArray(venda.itens) ? venda.itens.map(item => `${item.nome} (x${item.quantidade})`).join(', ') : 'Itens não disponíveis';
            const pagamentosDesc = Array.isArray(venda.pagamentos) ? venda.pagamentos.map(p => `${p.metodo.toUpperCase()}: R$ ${p.valor.toFixed(2)}`).join(' | ') : 'N/A';
            const fiadoDesc = venda.fiado ? ` | FIADO: R$ ${venda.fiado.valor.toFixed(2)}` : '';
            
            const vendaDiv = document.createElement('div');
            vendaDiv.className = 'produto-item'; // Reutilizando estilo
            vendaDiv.innerHTML = `
                <div class="info">
                    <span>${new Date(venda.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})} - ${itensDesc}</span><br>
                    <small><strong>Total: R$ ${(venda.total || 0).toFixed(2)}</strong> (${pagamentosDesc}${fiadoDesc})</small>
                </div>
            `;
            listaVendasDiaEl.appendChild(vendaDiv);
        });
    };

    const atualizarInterfaceCompleta = () => {
        const vendasDia = getVendasDoPeriodo(dataAtualVisualizada, 'dia');
        let totalVendido = 0, lucroLiquido = 0, totalDinheiro = 0, totalPix = 0;
        
        if (Array.isArray(vendasDia)) {
            vendasDia.forEach(venda => {
                totalVendido += venda.total || 0;
                if (Array.isArray(venda.pagamentos)) {
                    venda.pagamentos.forEach(p => { if(!p.quitacao) { if(p.metodo === 'dinheiro') totalDinheiro += p.valor; if(p.metodo === 'pix') totalPix += p.valor; } });
                }
                if (Array.isArray(venda.itens)) {
                    venda.itens.forEach(item => {
                        const precoDoItem = item.precoTotal || 0;
                        const custoDoItem = (item.custoUnitario || 0) * (item.quantidade || 0);
                        lucroLiquido += (precoDoItem - custoDoItem);
                    });
                }
            });
        }
        
        const totalFiado = vendas.filter(v => v.fiado && !v.fiado.quitado).reduce((acc, v) => acc + v.fiado.valor, 0);

        document.getElementById('total-vendido-dia').textContent = `R$ ${totalVendido.toFixed(2)}`;
        document.getElementById('lucro-liquido-dia').textContent = `R$ ${lucroLiquido.toFixed(2)}`;
        document.getElementById('total-dinheiro-dia').textContent = `R$ ${totalDinheiro.toFixed(2)}`;
        document.getElementById('total-pix-dia').textContent = `R$ ${totalPix.toFixed(2)}`;
        document.getElementById('total-fiado-dia').textContent = `R$ ${totalFiado.toFixed(2)}`;
        
        renderizarProdutos();
        renderizarFiado();
        renderizarVendasDoDia(vendasDia);
    };
    
    // --- ATRIBUINDO EVENTOS (EVENT LISTENERS) ---
    const inicializarEventos = () => {
        document.getElementById('btn-dia-anterior').addEventListener('click', () => { dataAtualVisualizada.setDate(dataAtualVisualizada.getDate() - 1); atualizarDisplayData(); });
        document.getElementById('btn-dia-seguinte').addEventListener('click', () => { dataAtualVisualizada.setDate(dataAtualVisualizada.getDate() + 1); atualizarDisplayData(); });
        document.getElementById('btn-hoje').addEventListener('click', () => { dataAtualVisualizada = new Date(); atualizarDisplayData(); });
        
        document.getElementById('btn-abrir-modal-produto').addEventListener('click', () => abrirModalProduto(false));
        document.getElementById('fechar-modal-produto').addEventListener('click', fecharModalProduto);
        formProduto.addEventListener('submit', salvarProdutoHandler);

        document.getElementById('btn-abrir-modal-venda').addEventListener('click', abrirModalVenda);
        document.getElementById('fechar-modal-venda').addEventListener('click', () => { modalVenda.style.display = 'none'; });
        formVenda.addEventListener('submit', salvarVendaHandler);

        document.getElementById('custo-pacote').addEventListener('input', calcularCustoUnitario);
        document.getElementById('itens-por-pacote').addEventListener('input', calcularCustoUnitario);
        
        document.getElementById('btn-adicionar-item-venda').addEventListener('click', () => { 
            const select = document.getElementById('selecionar-produto-venda');
            const produtoId = parseInt(select.value);
            if(!produtoId) return;
            const produto = produtos.find(p => p.id === produtoId);
            const quantidadeParaVender = 1; 
            if (produto.quantidadeEstoque < quantidadeParaVender) {
                alert(`Estoque insuficiente para ${produto.nome}.`);
                return;
            }
            itensVendaAtual.push({
                id: produto.id, nome: produto.nome, quantidade: quantidadeParaVender,
                precoTotal: produto.preco * quantidadeParaVender, custoUnitario: produto.custoUnitario, isPromo: false
            });
            renderizarItensVenda();
        });
        document.getElementById('btn-adicionar-promo').addEventListener('click', () => {
            const descricao = document.getElementById('promo-descricao').value;
            const preco = parseFloat(document.getElementById('promo-preco').value);
            if (!descricao || isNaN(preco) || preco <= 0) {
                alert('Preencha a descrição e o preço da promoção.');
                return;
            }
            itensVendaAtual.push({
                id: `promo-${Date.now()}`, nome: `Promo: ${descricao}`, quantidade: 1,
                precoTotal: preco, isPromo: true, custoUnitario: 0
            });
            renderizarItensVenda();
            document.getElementById('promo-descricao').value = '';
            document.getElementById('promo-preco').value = '';
        });
        ['pagamento-dinheiro', 'pagamento-pix'].forEach(id => document.getElementById(id).addEventListener('input', atualizarResumoVenda));
        listaFiadoEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-receber')) {
                const vendaId = parseInt(e.target.getAttribute('data-venda-id'));
                const venda = vendas.find(v => v.id === vendaId);
                if (venda) {
                    const metodo = prompt('Como o pagamento foi recebido? (dinheiro/pix)', 'dinheiro');
                    if (metodo && (metodo === 'dinheiro' || metodo === 'pix')) {
                        venda.fiado.quitado = true;
                        venda.pagamentos.push({ metodo: metodo, valor: venda.fiado.valor, quitacao: true, data: new Date().toISOString() });
                        salvarVendas();
                        atualizarInterfaceCompleta();
                        alert(`Dívida de ${venda.fiado.cliente} quitada com sucesso!`);
                    } else if(metodo !== null) {
                        alert('Método inválido. Use "dinheiro" ou "pix".');
                    }
                }
            }
        });
        abasRelatorio.addEventListener('click', (e) => {
            if (e.target.classList.contains('aba')) {
                abasRelatorio.querySelector('.aba.ativa').classList.remove('ativa');
                e.target.classList.add('ativa');
                periodoRelatorioSelecionado = e.target.getAttribute('data-periodo');
            }
        });
        document.getElementById('btn-baixar-txt').addEventListener('click', () => {
            const conteudo = gerarRelatorioTxt();
            baixarArquivo(`relatorio-${periodoRelatorioSelecionado}.txt`, conteudo);
        });
        document.getElementById('btn-baixar-csv').addEventListener('click', () => {
            const conteudo = gerarRelatorioCsv();
            baixarArquivo(`relatorio-${periodoRelatorioSelecionado}.csv`, conteudo);
        });
        listaProdutosEl.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const produtoId = parseInt(target.getAttribute('data-id'));
            if (target.classList.contains('btn-editar-produto')) {
                idProdutoEmEdicao = produtoId;
                abrirModalProduto(true);
            } else if (target.classList.contains('btn-excluir-produto')) {
                if (confirm('Tem certeza que deseja excluir este produto?')) {
                    produtos = produtos.filter(p => p.id !== produtoId);
                    salvarProdutos();
                    renderizarProdutos();
                }
            }
        });
    };

    // --- INICIALIZAÇÃO ---
    inicializarEventos();
    atualizarDisplayData();
});