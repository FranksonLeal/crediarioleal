// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getFirestore, collection, runTransaction, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCT7dfUSq3TwIcVJ-Gh2Qodp-2sGcyM3Hs",
    authDomain: "crediarioleal.firebaseapp.com",
    projectId: "crediarioleal",
    storageBucket: "crediarioleal.appspot.com",
    messagingSenderId: "386757082416",
    appId: "1:386757082416:web:42526e44c164935dcd9cf5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Atualiza a lista de clientes nos selects
async function atualizarSelectClientes() {
    const selects = [
        document.getElementById('clienteConsulta'),
        document.getElementById('editarCliente'),
        document.getElementById('clienteExcluir')
    ];  

    selects.forEach(select => {
        if (select) {
            select.innerHTML = ''; // Limpa as opções existentes
        }
    });

    const querySnapshot = await getDocs(collection(db, "clientes"));
    querySnapshot.forEach((doc) => {
        const option = new Option(doc.data().nome, doc.id);
        selects.forEach(select => {
            if (select) {
                select.add(option); // Adiciona a opção ao select se o elemento existir
            }
        });
    });
}





// Função para preencher o select de clientes na seção de compra
async function atualizarSelectClientesCompra() {
    const selectClienteCompra = document.getElementById('clienteCompra');
    selectClienteCompra.innerHTML = '<option value="">Selecione um cliente</option>'; // Limpa as opções existentes

    const querySnapshot = await getDocs(collection(db, "clientes"));
    querySnapshot.forEach((doc) => {
        const option = new Option(doc.data().nome, doc.id);
        selectClienteCompra.add(option);
    });
}



// Carregar todos os clientes ao iniciar a página
window.onload = async function() {
    const clienteCompraSelect = document.getElementById('clienteCompra');
    const clienteConsultaSelect = document.getElementById('clienteConsulta');

    await carregarClientes(clienteCompraSelect);
    await carregarClientes(clienteConsultaSelect);
}



// Função para carregar todos os clientes e preencher o select
async function carregarClientes(selectElement) {
    try {
        // Limpa o select antes de preencher com novos dados
        selectElement.innerHTML = '<option value="">Selecione um cliente</option>';
        
        // Consulta todos os clientes
        const clientesSnapshot = await getDocs(collection(db, "clientes"));
        
        // Preenche o select com todos os clientes
        clientesSnapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = data.nome;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}






// Função para filtrar clientes na seção de compra
window.filtrarClientes = async function() {
    const input = document.getElementById('clienteInput').value.toLowerCase();
    const select = document.getElementById('clienteCompra');
    
    // Limpa o select antes de preencher com novos dados
    select.innerHTML = '<option value="">Selecione um cliente</option>';

    if (input.length > 0) {
        try {
            // Consulta os clientes que correspondem à entrada do usuário
            const clientesSnapshot = await getDocs(collection(db, "clientes"));
            const clientes = [];

            clientesSnapshot.forEach(doc => {
                const data = doc.data();
                const nomeCliente = data.nome.toLowerCase();

                // Se o nome do cliente contém a entrada, adiciona ao array
                if (nomeCliente.includes(input)) {
                    clientes.push({ id: doc.id, nome: data.nome });
                }
            });

            // Preenche o select com os clientes correspondentes
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = cliente.nome;
                select.appendChild(option);
            });

            // Se houver clientes encontrados, selecione o primeiro
            if (clientes.length > 0) {
                select.value = clientes[0].id; // Seleciona automaticamente o primeiro cliente encontrado
            }
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        }
    } else {
        // Se o campo estiver vazio, recarrega todos os clientes
        await carregarClientes(select);
    }
}

// Registrar Compra
document.getElementById('compraForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const clienteId = document.getElementById('clienteCompra').value;
    const valor = parseFloat(document.getElementById('valor').value);

    if (!clienteId) {
        alert('Selecione um cliente!');
        return;
    }

    try {
        const clienteRef = doc(db, "clientes", clienteId);
        const clienteSnap = await getDoc(clienteRef);

        if (clienteSnap.exists()) {
            const clienteData = clienteSnap.data();
            const limiteCredito = clienteData.limiteCredito;
            const faturas = clienteData.faturas || {};

            const dataAtual = new Date();
            const mesAnoAtual = dataAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

            let totalMensal = 0;
            if (Array.isArray(faturas[mesAnoAtual])) {
                totalMensal = faturas[mesAnoAtual].reduce((acc, compra) => acc + compra.valor, 0);
            }

            const valorDisponivel = limiteCredito - totalMensal;

            if (valor > valorDisponivel) {
                alert(`Compra não registrada! Limite disponível: R$ ${valorDisponivel.toFixed(2)}`);
                return;
            }

            if (!faturas[mesAnoAtual]) {
                faturas[mesAnoAtual] = [];
            }

            faturas[mesAnoAtual].push({
                valor: valor,
                data: dataAtual.toLocaleDateString()
            });

            await updateDoc(clienteRef, { faturas: faturas });

            alert('Compra registrada com sucesso!');
            document.getElementById('compraForm').reset();
            select.innerHTML = '<option value="">Selecione um cliente</option>'; // Reseta o select
        } else {
            alert('Cliente não encontrado!');
        }
    } catch (error) {
        console.error('Erro ao registrar compra:', error);
        alert('Erro ao registrar a compra. Tente novamente.');
    }
});





// Função para mostrar e ocultar seções
function mostrarSecao(secaoId) {
    const secoes = ['cadastroSection', 'compraSection', 'consultaSection', 'editarSection', 'excluirSection'];
    secoes.forEach(secao => {
        document.getElementById(secao).style.display = secao === secaoId ? 'block' : 'none';
    });
}

// Registra os eventos de clique nos botões do menu
document.getElementById('menuCadastro').addEventListener('click', () => {
    mostrarSecao('cadastroSection');
});
document.getElementById('menuCompra').addEventListener('click', () => {
    mostrarSecao('compraSection');
});
document.getElementById('menuConsulta').addEventListener('click', () => {
    mostrarSecao('consultaSection');
});
document.getElementById('menuEditar').addEventListener('click', () => {
    mostrarSecao('editarSection');
});
document.getElementById('menuExcluir').addEventListener('click', () => {
    mostrarSecao('excluirSection');
});

// Cadastrar Cliente
document.getElementById('clienteForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const limiteCredito = parseFloat(document.getElementById('limiteCredito').value);

    try {
        // Inicializando faturas com um mês vazio
        await addDoc(collection(db, "clientes"), {
            nome,
            email,
            limiteCredito,
            faturas: {} // Inicializa faturas como um objeto vazio
        });
        alert('Cliente cadastrado com sucesso!');
        atualizarSelectClientes();
        document.getElementById('clienteForm').reset();
    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
    }
});







// Carrega os clientes no carregamento da página
document.addEventListener('DOMContentLoaded', async () => {
    await atualizarSelectClientes();
    await atualizarSelectClientesConsulta();
});







// Função para preencher o select de clientes na seção de consulta
async function atualizarSelectClientesConsulta() {
    const selectClienteConsulta = document.getElementById('clienteConsulta');
    await carregarClientes(selectClienteConsulta); // Preenche o select com todos os clientes
}











// Função para filtrar clientes na seção de consulta
window.filtrarClientesConsulta = async function() {
    const input = document.getElementById('clienteConsultaInput').value.toLowerCase();
    const select = document.getElementById('clienteConsulta');

    if (input.length > 0) {
        try {
            // Limpa o select antes de preencher com novos dados
            select.innerHTML = '<option value="">Selecione um cliente</option>';

            // Consulta os clientes que correspondem à entrada do usuário
            const clientesSnapshot = await getDocs(collection(db, "clientes"));
            const clientes = [];

            clientesSnapshot.forEach(doc => {
                const data = doc.data();
                const nomeCliente = data.nome.toLowerCase();

                // Se o nome do cliente contém a entrada, adiciona ao array
                if (nomeCliente.includes(input)) {
                    clientes.push({ id: doc.id, nome: data.nome });
                }
            });

            // Preenche o select com os clientes correspondentes
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = cliente.nome;
                select.appendChild(option);
            });

            // Se houver clientes encontrados, selecione o primeiro e carregue os meses
            if (clientes.length > 0) {
                select.value = clientes[0].id; // Seleciona automaticamente o primeiro cliente encontrado
                await exibirMesesFaturas(clientes[0].id); // Carrega os meses para o primeiro cliente
            }
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        }
    } else {
        // Se o campo estiver vazio, recarrega todos os clientes
        await carregarClientes(select);
    }
}

// Função para exibir meses disponíveis de faturas para o cliente selecionado
window.exibirMesesFaturas = async function (clienteId) {
    try {
        const clienteRef = doc(db, "clientes", clienteId);
        const clienteSnap = await getDoc(clienteRef);

        if (clienteSnap.exists()) {
            const clienteData = clienteSnap.data();
            const faturas = clienteData.faturas || {};

            // Verifique o conteúdo das faturas para depuração
            console.log("Faturas encontradas:", faturas);

            const mesesDisponiveis = Object.keys(faturas).sort(); // Obtém e ordena os meses disponíveis

            // Limpa a lista de meses
            const mesesContainer = document.getElementById('mesesFaturas');
            mesesContainer.innerHTML = '';

            // Adiciona os meses ao select
            if (mesesDisponiveis.length > 0) {
                mesesDisponiveis.forEach((mes) => {
                    const option = document.createElement('option');
                    option.value = mes;
                    option.textContent = mes; // Define o texto da opção
                    mesesContainer.appendChild(option);
                });
            } else {
                // Exibe uma opção informando que não há faturas
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Sem faturas disponíveis';
                mesesContainer.appendChild(option);
            }
        } else {
            alert('Cliente não encontrado!');
        }
    } catch (error) {
        console.error('Erro ao exibir meses das faturas:', error);
        alert('Erro ao carregar as faturas. Tente novamente.');
    }
};

// Adicionar evento para o formulário de consulta
document.getElementById('consultaForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const clienteId = document.getElementById('clienteConsulta').value;
    const mes = document.getElementById('mesesFaturas').value;

    if (!clienteId || !mes) {
        alert('Selecione um cliente e um mês!');
        return;
    }

    await mostrarFaturaDoMes(clienteId, mes);
});

// Preencher o select de meses quando um cliente for selecionado na consulta
document.getElementById('clienteConsulta').addEventListener('change', async (event) => {
    const clienteId = event.target.value;
    if (clienteId) {
        await exibirMesesFaturas(clienteId);
    }
});

// Chamar a função para carregar os clientes ao inicializar a página
document.addEventListener('DOMContentLoaded', atualizarSelectClientesConsulta);








// Função para obter o próximo mês no formato "mesAno" (ex: "outubro de 2024")
function getProximoMesNome(mesAtual) {
    const meses = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

    // Divide o mesAtual em nome do mês e ano
    const [mesNome, ano] = mesAtual.toLowerCase().split(" de ");
    const mesIndex = meses.indexOf(mesNome);

    if (mesIndex === -1 || !ano) {
        console.error("O mês atual está em um formato incorreto:", mesAtual);
        return null;
    }

    // Calcula o próximo mês e ano
    const novoMesIndex = (mesIndex + 1) % 12;
    const novoAno = novoMesIndex === 0 ? parseInt(ano) + 1 : ano;
    const proximoMesNome = `${meses[novoMesIndex]} de ${novoAno}`;

    return proximoMesNome;
}






// Função para exibir fatura de um mês específico
// Função para exibir fatura de um mês específico
window.mostrarFaturaDoMes = async function (clienteId, mes) {
    const resultadoConsulta = document.getElementById('resultadoConsulta');
    resultadoConsulta.innerHTML = ''; // Limpa resultados anteriores

    try {
        const clienteRef = doc(db, "clientes", clienteId);
        const clienteSnap = await getDoc(clienteRef);

        if (clienteSnap.exists()) {
            const clienteData = clienteSnap.data();
            const faturas = clienteData.faturas || {};
            let totalFatura = 0; // Inicializa o total da fatura
            
            // Verifica se existem faturas para o mês selecionado
            if (faturas[mes] && faturas[mes].length > 0) {
                resultadoConsulta.innerHTML = `<h3>Faturas para ${clienteData.nome} no mês de ${mes}:</h3>`;
                
                faturas[mes].forEach((fatura) => {
                    const valorFatura = fatura.valor || 0; // Pega o valor se existir, senão 0
                    const pagamentoFatura = fatura.pagamento || 0; // Pega o pagamento se existir, senão 0
                    const transferenciaFatura = fatura.transferencia || 0; // Pega a transferência se existir, senão 0
                    
                    totalFatura += valorFatura; // Acumula o valor total da fatura
                    totalFatura -= (pagamentoFatura + transferenciaFatura); // Subtrai os pagamentos e transferências

                    // Exibe as informações da fatura
                    if (valorFatura > 0) {
                        resultadoConsulta.innerHTML += `<p>Compra: R$ ${valorFatura} em ${fatura.data}</p>`;
                    }
                    if (pagamentoFatura > 0) {
                        resultadoConsulta.innerHTML += `<p>Pagamento: R$ ${pagamentoFatura} em ${fatura.data}</p>`;
                    }
                    if (transferenciaFatura > 0) {
                        resultadoConsulta.innerHTML += `<p>Transferência: R$ ${transferenciaFatura} em ${fatura.data}</p>`;
                    }
                });

                // Exibe o total da fatura atualizada
                resultadoConsulta.innerHTML += `<h4>Total Atual da Fatura: R$ ${totalFatura.toFixed(2)}</h4>`;
            } else {
                resultadoConsulta.innerHTML = 'Não há faturas disponíveis para o mês selecionado.';
            }
        } else {
            resultadoConsulta.innerHTML = 'Cliente não encontrado.';
        }
    } catch (error) {
        console.error('Erro ao mostrar fatura do mês:', error);
        resultadoConsulta.innerHTML = 'Erro ao carregar a fatura.';
    }
};




document.getElementById('transferirSaldoForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const clienteId = document.getElementById('clienteConsulta').value;
    const mesAtual = document.getElementById('mesesFaturas').value;
    let valorTransferencia = parseFloat(document.getElementById('valorTransferencia').value);

    if (isNaN(valorTransferencia) || valorTransferencia <= 0) {
        alert('Valor de transferência inválido!');
        return;
    }

    try {
        const clienteRef = doc(db, "clientes", clienteId);
        await runTransaction(db, async (transaction) => {
            const clienteSnap = await transaction.get(clienteRef);

            if (clienteSnap.exists()) {
                const clienteData = clienteSnap.data();
                const faturas = clienteData.faturas || {};

                // Verificar se existem faturas para o mês atual
                if (faturas[mesAtual]) {
                    // Calcular o total da fatura atual
                    let totalFaturaAtual = faturas[mesAtual].reduce((acc, compra) => acc + (compra.valor || 0), 0);
                    // Calcular total dos pagamentos realizados
                    let totalPagamentos = faturas[mesAtual].reduce((acc, compra) => acc + (compra.pagamento || 0), 0);

                    // Calcular saldo disponível
                    let saldoDisponivel = totalFaturaAtual - totalPagamentos;

                    // Verificar se o valor a ser transferido é maior que o saldo disponível
                    if (valorTransferencia > saldoDisponivel) {
                        alert('O valor a ser transferido é maior que o saldo disponível!');
                        return;
                    }

                    // Adiciona um registro de transferência ao mês atual
                    if (!Array.isArray(faturas[mesAtual])) {
                        faturas[mesAtual] = []; // Inicializa se não existir
                    }

                    faturas[mesAtual].push({
                        transferencia: valorTransferencia, // Armazena a transferência
                        data: new Date().toLocaleDateString()
                    });

                    // Atualiza o documento do cliente no Firestore
                    transaction.update(clienteRef, { faturas });

                    alert('Saldo transferido com sucesso!');
                    document.getElementById('transferirSaldoForm').reset();
                } else {
                    alert('Não há saldo disponível para o mês selecionado!');
                }
            } else {
                alert('Cliente não encontrado.');
            }
        });
    } catch (error) {
        console.error('Erro ao transferir saldo:', error);
        alert('Erro ao transferir saldo. Tente novamente.');
    }
});






// Função para pagar fatura
// Função para pagar fatura
// Função para pagar fatura
document.getElementById('pagarFatura').addEventListener('click', async () => {
    const clienteId = document.getElementById('clienteConsulta').value; // Assume que o cliente está selecionado
    const mes = document.getElementById('mesesFaturas').value; // Mês da fatura a ser paga
    let valorPagamento = parseFloat(prompt('Digite o valor a ser pago:')); // Solicita o valor do pagamento

    if (!clienteId || !mes) {
        alert('Selecione um cliente e um mês!');
        return;
    }

    if (isNaN(valorPagamento) || valorPagamento <= 0) {
        alert('Digite um valor válido para o pagamento.');
        return;
    }

    try {
        const clienteRef = doc(db, "clientes", clienteId);
        const clienteSnap = await getDoc(clienteRef);

        if (clienteSnap.exists()) {
            const clienteData = clienteSnap.data();
            const faturas = clienteData.faturas || {};
            let totalFatura = 0;

            // Verifica se existem faturas para o mês selecionado
            if (faturas[mes] && faturas[mes].length > 0) {
                faturas[mes].forEach((fatura) => {
                    totalFatura += fatura.valor || 0; // Soma os valores das faturas
                });

                // Validação do pagamento
                if (valorPagamento > totalFatura) {
                    alert('O valor do pagamento não pode ser maior que o total da fatura.');
                    return;
                }

                // Atualiza a fatura com o pagamento
                faturas[mes].forEach((fatura) => {
                    if (valorPagamento > 0) {
                        const valorFatura = fatura.valor || 0;

                        // Se o pagamento for maior que o valor da fatura
                        if (valorPagamento >= valorFatura) {
                            fatura.pagamento = (fatura.pagamento || 0) + valorFatura;
                            fatura.valor = 0; // Fatura paga
                            valorPagamento -= valorFatura; // Diminui o valor do pagamento
                        } else {
                            fatura.pagamento = (fatura.pagamento || 0) + valorPagamento; // Adiciona o pagamento
                            fatura.valor -= valorPagamento; // Atualiza o valor da fatura
                            valorPagamento = 0; // Zera o valor do pagamento
                        }
                    }
                });

                // Atualiza o documento do cliente
                await updateDoc(clienteRef, { faturas });

                // Atualiza o total da fatura
                await mostrarFaturaDoMes(clienteId, mes); // Atualiza a exibição após o pagamento

                alert('Pagamento realizado com sucesso!');
            } else {
                alert('Não há faturas disponíveis para o mês selecionado.');
            }
        } else {
            alert('Cliente não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        alert('Ocorreu um erro ao processar o pagamento.');
    }
});










// Função para preencher os campos com os dados do cliente selecionado
async function preencherCamposCliente(clienteId) {
    try {
        const clienteRef = doc(db, "clientes", clienteId);
        const clienteSnapshot = await getDoc(clienteRef);
        
        if (clienteSnapshot.exists()) {
            const data = clienteSnapshot.data();
            document.getElementById('novoNome').value = data.nome;
            document.getElementById('novoEmail').value = data.email;
            document.getElementById('novoLimiteCredito').value = data.limiteCredito;
        } else {
            console.log('Cliente não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao buscar dados do cliente:', error);
    }
}

// Evento para preencher os campos automaticamente quando um cliente é selecionado
document.getElementById('editarCliente').addEventListener('change', (event) => {
    const clienteId = event.target.value;
    if (clienteId) {
        preencherCamposCliente(clienteId);
    } else {
        // Limpar os campos se nenhum cliente for selecionado
        document.getElementById('novoNome').value = '';
        document.getElementById('novoEmail').value = '';
        document.getElementById('novoLimiteCredito').value = '';
    }
});

// Função para filtrar clientes na seção de edição
window.filtrarClientesEditar = async function() {
    const input = document.getElementById('editarClienteInput').value.toLowerCase();
    const select = document.getElementById('editarCliente');

    if (input.length > 0) {
        try {
            // Limpa o select antes de preencher com novos dados
            select.innerHTML = '<option value="">Selecione um cliente</option>';

            // Consulta os clientes que correspondem à entrada do usuário
            const clientesSnapshot = await getDocs(collection(db, "clientes"));
            const clientes = [];

            clientesSnapshot.forEach(doc => {
                const data = doc.data();
                const nomeCliente = data.nome.toLowerCase();

                // Se o nome do cliente contém a entrada, adiciona ao array
                if (nomeCliente.includes(input)) {
                    clientes.push({ id: doc.id, nome: data.nome });
                }
            });

            // Preenche o select com os clientes correspondentes
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = cliente.nome;
                select.appendChild(option);
            });

            // Se houver clientes encontrados, selecione o primeiro
            if (clientes.length > 0) {
                select.value = clientes[0].id; // Seleciona automaticamente o primeiro cliente encontrado
                preencherCamposCliente(select.value); // Preenche os campos automaticamente
            }
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        }
    } else {
        // Se o campo estiver vazio, recarrega todos os clientes
        await carregarClientes(select);
    }
}

// Carregar todos os clientes ao iniciar a página na seção de edição
window.onload = async function() {
    const editarClienteSelect = document.getElementById('editarCliente');
    await carregarClientes(editarClienteSelect);
}

// Função para editar um cliente
document.getElementById('editarForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const clienteId = document.getElementById('editarCliente').value;
    const novoNome = document.getElementById('novoNome').value;
    const novoEmail = document.getElementById('novoEmail').value;
    const novoLimiteCredito = parseFloat(document.getElementById('novoLimiteCredito').value);

    try {
        const clienteRef = doc(db, "clientes", clienteId);
        await updateDoc(clienteRef, {
            nome: novoNome,
            email: novoEmail,
            limiteCredito: novoLimiteCredito
        });
        alert('Cliente editado com sucesso!');
        await carregarClientes(editarClienteSelect); // Atualiza o select após edição
        document.getElementById('editarForm').reset();
    } catch (error) {
        console.error('Erro ao editar cliente:', error);
    }
});











// Função para preencher os campos com os dados do cliente selecionado
async function preencherCamposClienteExcluir(clienteId) {
    try {
        const clienteRef = doc(db, "clientes", clienteId);
        const clienteSnapshot = await getDoc(clienteRef);
        
        if (clienteSnapshot.exists()) {
            const data = clienteSnapshot.data();
            document.getElementById('clienteNome').value = data.nome;
            document.getElementById('clienteEmail').value = data.email;
        } else {
            console.log('Cliente não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao buscar dados do cliente:', error);
    }
}

// Função para filtrar clientes na seção de exclusão
window.filtrarClientesExcluir = async function() {
    const input = document.getElementById('clienteInputExcluir').value.toLowerCase();
    const select = document.getElementById('clienteExcluir');



    if (input.length > 0) {
        try {
            // Limpa o select antes de preencher com novos dados
            select.innerHTML = '<option value="">Selecione um cliente</option>';
            // Consulta todos os clientes
            const clientesSnapshot = await getDocs(collection(db, "clientes"));
            const clientes = [];

            // Filtra clientes que correspondem à entrada do usuário
            clientesSnapshot.forEach(doc => {
                const data = doc.data();
                const nomeCliente = data.nome.toLowerCase();

                // Se o nome do cliente contém a entrada, adiciona ao array
                if (nomeCliente.includes(input)) {
                    clientes.push({ id: doc.id, nome: data.nome });
                }
            });

            // Preenche o select com os clientes correspondentes
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = cliente.nome;
                select.appendChild(option);
            });

            // Se houver clientes encontrados, selecione o primeiro automaticamente
            if (clientes.length > 0) {
                const primeiroClienteId = clientes[0].id; // Armazena o ID do primeiro cliente encontrado
                select.value = primeiroClienteId; // Seleciona automaticamente o primeiro cliente encontrado
                preencherCamposClienteExcluir(primeiroClienteId); // Preenche os campos automaticamente
            } else {
                // Limpar os campos se nenhum cliente for encontrado
                document.getElementById('clienteNome').value = '';
                document.getElementById('clienteEmail').value = '';
            }
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        }
    } else {
        // Se o campo estiver vazio, recarrega todos os clientes
        await carregarClientes(select);
    }
}



// Carregar todos os clientes quando a seção for exibida
document.getElementById('excluirForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const clienteId = document.getElementById('clienteExcluir').value;

    if (confirm(`Tem certeza que deseja excluir o cliente?`)) {
        try {
            const clienteRef = doc(db, "clientes", clienteId);
            await deleteDoc(clienteRef);
            alert('Cliente excluído com sucesso!');
            // Limpa os campos após a exclusão
            document.getElementById('excluirForm').reset();
            document.getElementById('clienteNome').value = '';
            document.getElementById('clienteEmail').value = '';
            // Atualiza a lista de clientes
            await carregarClientes(document.getElementById('clienteExcluir'));
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            alert('Erro ao excluir cliente. Tente novamente.');
        }
    }
});

// Carregar clientes quando a página for carregada
window.onload = async function() {
    const clienteExcluirSelect = document.getElementById('clienteExcluir');
    await carregarClientes(clienteExcluirSelect);
}




// Chamadas para atualização dos selects na inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await atualizarSelectClientes();
    await atualizarSelectClientesCompra();
    await atualizarSelectClientesConsulta();
});