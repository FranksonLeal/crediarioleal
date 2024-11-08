import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getFirestore, collection, runTransaction, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyCT7dfUSq3TwIcVJ-Gh2Qodp-2sGcyM3Hs",
    authDomain: "crediarioleal.firebaseapp.com",
    projectId: "crediarioleal",
    storageBucket: "crediarioleal.appspot.com",
    messagingSenderId: "386757082416",
    appId: "1:386757082416:web:42526e44c164935dcd9cf5"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Atualiza a lista de clientes nos selects
async function atualizarSelectClientes() {
    const selects = [
        document.getElementById('clienteConsulta'),

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
window.onload = async function () {
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








// --------------------------------------INICIO DA SEÇÃO DE REGISTRO DE COMPRA---------------------------------------------------

// Função para filtrar clientes na seção de compra
window.filtrarClientes = async function () {
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



// Função para filtrar clientes e, em seguida, atualizar o limite disponível
window.filtrarClientesEAtualizarLimite = async function () {
    const clienteNome = document.getElementById('clienteInput').value;
    const clienteSelect = document.getElementById('clienteCompra');

    // Limpa as opções existentes
    clienteSelect.innerHTML = '<option value="">Selecione um cliente</option>';

    // Filtra e preenche clientes (exemplo de chamada para o banco de dados)
    const clientesRef = collection(db, "clientes");
    const querySnapshot = await getDocs(clientesRef);

    let clienteEncontrado = null;
    querySnapshot.forEach((doc) => {
        const clienteData = doc.data();
        if (clienteData.nome.toLowerCase().includes(clienteNome.toLowerCase())) {
            const option = document.createElement('option');
            option.value = doc.id;
            option.text = clienteData.nome;
            clienteSelect.appendChild(option);

            // Seleciona automaticamente o cliente
            if (!clienteEncontrado) {
                clienteEncontrado = doc.id;
                clienteSelect.value = doc.id;
            }
        }
    });

    // Se um cliente foi encontrado e selecionado, atualiza o limite
    if (clienteEncontrado) {
        atualizarLimite();
    }
}

// Função global para atualizar o limite
window.atualizarLimite = async function () {
    const clienteId = document.getElementById('clienteCompra').value;
    const limiteDisponivelField = document.getElementById('limiteDisponivel');

    if (!clienteId) {
        limiteDisponivelField.value = "R$ 0,00";
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
            limiteDisponivelField.value = `R$ ${valorDisponivel.toFixed(2)}`;
        } else {
            limiteDisponivelField.value = "R$ 0,00";
        }
    } catch (error) {
        console.error('Erro ao buscar limite disponível:', error);
        limiteDisponivelField.value = "Erro ao carregar";
    }
};




// Registrar Compra
document.getElementById('compraForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const clienteId = document.getElementById('clienteCompra').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const select = document.getElementById('clienteCompra'); // Seleciona o elemento do select

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

            // Adiciona a nova compra
            faturas[mesAnoAtual].push({
                tipo: 'Compra',
                valor: valor,
                data: dataAtual.toLocaleString('pt-BR') // Adiciona data e horário completos
            });

            await updateDoc(clienteRef, { faturas: faturas });

            alert('Compra registrada com sucesso!');
            document.getElementById('compraForm').reset();
            select.selectedIndex = 0; // Reseta a seleção para a opção padrão
        } else {
            alert('Cliente não encontrado!');
        }
    } catch (error) {
        console.error('Erro ao registrar compra:', error);
        alert('Erro ao registrar a compra. Tente novamente.');
    }
});

// ----------------------------------------------FIM DA SEÇÃO DE REGISTRO DE COMPRA-------------------------------------------------



// Função para mostrar e ocultar seções
function mostrarSecao(secaoId) {
    const secoes = ['cadastroSection', 'compraSection', 'consultaSection', 'visualizarClientesSection'];
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
document.getElementById('menuVisualizar').addEventListener('click', () => {
    mostrarSecao('visualizarClientesSection');
});









// ----------------------------------------------------INICIO DA SEÇÃO DE CADASTRO DE CLIENTE------------------------------------------

// Formata o telefone no formato desejado
document.getElementById('telefone').addEventListener('input', (event) => {
    let telefone = event.target.value.replace(/\D/g, '');
    if (telefone.length > 11) telefone = telefone.slice(0, 11);
    telefone = telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    event.target.value = telefone;
});

// Busca o endereço pelo CEP e preenche o campo automaticamente
async function buscarEnderecoPorCEP() {
    const cep = document.getElementById('cep').value.replace(/\D/g, '');
    if (cep.length === 8) { // Somente busca se o CEP tiver 8 dígitos
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                // Preenche o campo de endereço automaticamente
                document.getElementById('endereco').value = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
            } else {
                document.getElementById('endereco').value = ''; // Limpa o campo caso o CEP seja inválido
                alert('CEP não encontrado! Por favor, preencha o endereço manualmente.');
            }
        } catch (error) {
            console.error('Erro ao buscar endereço:', error);
            alert('Erro ao buscar endereço. Verifique o CEP e tente novamente.');
        }
    }
}

// Detecta mudança no campo de CEP e chama a função de busca automaticamente
document.getElementById('cep').addEventListener('input', buscarEnderecoPorCEP);

// Cadastrar Cliente
document.getElementById('clienteForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;
    const cep = document.getElementById('cep').value || 'sem cep'; // CEP opcional, registra "sem cep" se não informado
    const endereco = document.getElementById('endereco').value || 'Endereço não informado';
    const limiteCredito = parseFloat(document.getElementById('limiteCredito').value);

    try {
        await addDoc(collection(db, "clientes"), {
            nome,
            email,
            telefone,
            cep,
            endereco,
            limiteCredito,
            faturas: {}
        });
        alert('Cliente cadastrado com sucesso!');
        atualizarSelectClientes();
        document.getElementById('clienteForm').reset();
    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
    }
});


// ---------------------------------------------FIM DA SEÇÃO DE CCADASTRO DE CLIENTES-------------------------------------------------







// Carrega os clientes no carregamento da página
document.addEventListener('DOMContentLoaded', async () => {
    await atualizarSelectClientes();
    await atualizarSelectClientesConsulta();
});











//------------------------------------------- INICIO DA SEÇÃO DE CONSULTAR CREDIARIO CLIENTE-----------------------------------------

// Função para preencher o select de clientes na seção de consulta
async function atualizarSelectClientesConsulta() {
    const selectClienteConsulta = document.getElementById('clienteConsulta');
    await carregarClientes(selectClienteConsulta); // Preenche o select com todos os clientes
}




// Função para filtrar clientes na seção de consulta
window.filtrarClientesConsulta = async function () {
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



document.addEventListener('DOMContentLoaded', function () {
    window.mostrarModal = async function (clienteId, mes) {
        const modal = document.getElementById('modalCobrar');
        modal.style.display = 'block';

        try {
            // Aguardar o total da fatura
            const totalFatura = await mostrarFaturaDoMes(clienteId, mes);

            const clienteRef = doc(db, "clientes", clienteId);
            const clienteSnap = await getDoc(clienteRef);

            if (clienteSnap.exists()) {
                const clienteData = clienteSnap.data();
                const nomeCliente = clienteData.nome; // Supondo que o nome está no campo 'nome'

                const saudacao = gerarSaudacao();

                // Preencher o campo de mensagem
                const mensagemContainer = document.getElementById('mensagem');
                mensagemContainer.value = `${saudacao} ${nomeCliente},\n\n` +
                    `Sua conta no Comercial Leal para este mês está no valor de R$${totalFatura.toFixed(2)}.\n\n` +
                    `Nos avise quando você realizar o pagamento.😊\n\n` +
                    `Comercial Leal agradece a preferência 🤝`;

                // Exibir a mensagem formatada
                const mensagemFormatada = document.getElementById('mensagemFormatada');
                mensagemFormatada.innerHTML = `
                    <p style="font-size: 16px; color: #333;">${saudacao} <strong>${nomeCliente}</strong>,</p>
                    <p style="font-size: 16px; color: #333;">
                        Sua conta no Comercial Leal para este mês está no valor de <strong>R$${totalFatura.toFixed(2)}</strong>.
                    </p>
                    <p style="font-size: 16px; color: #333;">
                        Nos avise quando você realizar o pagamento.😊
                    </p>
                    <p style="font-size: 16px; color: #333;">
                        Comercial Leal agradece a preferência 🤝
                    </p>
                `;

                // Atualizar a mensagem formatada quando o texto do textarea mudar
                mensagemContainer.addEventListener('input', function () {
                    mensagemFormatada.innerHTML = mensagemContainer.value.replace(/\n/g, '<br>');
                });

                document.getElementById('enviarMensagem').onclick = async function () {
                    const metodoEnvio = document.getElementById('metodoEnvio').value;
                    const mensagemTexto = mensagemContainer.value; // Captura a mensagem editada

                    try {
                        if (metodoEnvio === 'whatsapp') {
                            await enviarWhatsApp(clienteId, mensagemTexto);
                        } else {
                            await enviarEmail(clienteId, mensagemTexto);
                        }
                        alert('Mensagem enviada com sucesso!'); // Confirmação para o usuário
                    } catch (error) {
                        console.error('Erro ao enviar a mensagem:', error);
                        alert('Ocorreu um erro ao enviar a mensagem. Tente novamente.');
                    } finally {
                        mensagemContainer.value = ''; // Limpa a mensagem
                        mensagemFormatada.innerHTML = ''; // Limpa a mensagem formatada
                        modal.style.display = 'none'; // Fecha o modal após o envio
                    }
                };

                document.getElementById('cancelarEnvio').onclick = function () {
                    modal.style.display = 'none'; // Fecha o modal sem enviar
                };
            } else {
                alert('Cliente não encontrado.');
                modal.style.display = 'none'; // Fecha o modal se o cliente não for encontrado
            }
        } catch (error) {
            console.error('Erro ao mostrar fatura do mês:', error);
            alert('Ocorreu um erro ao recuperar a fatura. Tente novamente.');
        }
    };
});



// Função para gerar a saudação de acordo com a hora atual
function gerarSaudacao() {
    const agora = new Date();
    const hora = agora.getHours();

    if (hora < 12) {
        return "Bom dia,";
    } else if (hora < 18) {
        return "Boa tarde,";
    } else {
        return "Boa noite,";
    }
}

// Função para enviar mensagem via WhatsApp
async function enviarWhatsApp(clienteId, mensagem) {
    const clienteRef = doc(db, "clientes", clienteId);
    const clienteSnap = await getDoc(clienteRef);

    if (clienteSnap.exists()) {
        const clienteData = clienteSnap.data();
        const numeroWhatsApp = clienteData.telefone; // Assumindo que o número está no campo 'whatsapp'

        if (numeroWhatsApp) {
            const url = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(mensagem)}`;
            window.open(url, '_blank'); // Abre o WhatsApp
        } else {
            alert('Número do WhatsApp não encontrado para este cliente.');
        }
    } else {
        alert('Cliente não encontrado.');
    }
}





// Função para obter o próximo mês no formato "mesAno" (ex: "outubro de 2024")
function getProximoMesNome(mesAtual) {
    const meses = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

    const [mesNome, ano] = mesAtual.toLowerCase().split(" de ");
    const mesIndex = meses.indexOf(mesNome);

    if (mesIndex === -1 || !ano) {
        console.error("O mês atual está em um formato incorreto:", mesAtual);
        return null;
    }

    const novoMesIndex = (mesIndex + 1) % 12;
    const novoAno = novoMesIndex === 0 ? parseInt(ano) + 1 : ano;
    const proximoMesNome = `${meses[novoMesIndex]} de ${novoAno}`;

    return proximoMesNome;
}



window.mostrarFaturaDoMes = async function (clienteId, mes) {
    const resultadoConsulta = document.getElementById('resultadoConsulta');
    resultadoConsulta.innerHTML = '';

    try {
        const clienteRef = doc(db, "clientes", clienteId);
        const clienteSnap = await getDoc(clienteRef);

        if (clienteSnap.exists()) {
            const clienteData = clienteSnap.data();
            const faturas = clienteData.faturas || {};
            let totalFatura = 0; // Inicializa o total da fatura

            if (faturas[mes] && faturas[mes].length > 0) {
                resultadoConsulta.innerHTML = `<h3>Faturas de ${clienteData.nome} no mês de ${mes}:</h3>`;

                faturas[mes].forEach((fatura) => {
                    const valorFatura = fatura.valor || 0;
                    const tipoFatura = fatura.tipo;

                    // Atualiza o total da fatura
                    if (['Compra', 'Pagamento', 'Transferência'].includes(tipoFatura)) {
                        totalFatura += tipoFatura === 'Compra' ? valorFatura : -valorFatura;
                    }

                    // Exibe os detalhes da fatura com borda
                    if (valorFatura > 0) {
                        resultadoConsulta.innerHTML += `
                            <div style="border: 1px solid #ccc; border-radius: 4px; padding: 10px; margin: 10px 0;">
                                <p>${tipoFatura}: R$ ${valorFatura.toFixed(2)} em ${new Date(fatura.data).toLocaleString()}</p>
                            </div>
                        `;
                    }
                });

                // Exibe o total da fatura ao final
                resultadoConsulta.innerHTML += `<h4>Total da Fatura: R$ ${totalFatura.toFixed(2)}</h4>`;
            } else {
                resultadoConsulta.innerHTML = 'Não há faturas disponíveis para o mês selecionado.';
            }
            return totalFatura; // Retorna o total da fatura
        } else {
            resultadoConsulta.innerHTML = 'Cliente não encontrado.';
            return 0; // Retorna 0 se o cliente não for encontrado
        }
    } catch (error) {
        console.error('Erro ao mostrar fatura do mês:', error);
        resultadoConsulta.innerHTML = `Erro ao carregar a fatura: ${error.message}`;
        return 0; // Retorna 0 em caso de erro
    }
};





// Função para abrir o modal
function abrirModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

// Função para fechar o modal
function fecharModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Abrir o modal para pagar fatura
document.getElementById('pagarFaturaBtn').addEventListener('click', () => {
    abrirModal('modalPagar');
});

// Abrir o modal para transferir saldo
document.getElementById('transferirSaldoBtn').addEventListener('click', () => {
    abrirModal('modalTransferir');
});

// Fechar o modal de pagar fatura
document.getElementById('cancelarPagamento').addEventListener('click', () => {
    fecharModal('modalPagar');
});

// Fechar o modal de transferir saldo
document.getElementById('cancelarTransferencia').addEventListener('click', () => {
    fecharModal('modalTransferir');
});

// Fechar o modal ao clicar fora do conteúdo
window.addEventListener('click', (event) => {
    if (event.target.id === 'modalPagar') {
        fecharModal('modalPagar');
    } else if (event.target.id === 'modalTransferir') {
        fecharModal('modalTransferir');
    }
});





// // Função para pagar fatura
// document.getElementById('pagarFaturaForm').addEventListener('submit', async (event) => {
//     event.preventDefault();

//     const clienteId = document.getElementById('clienteConsulta').value;
//     const mes = document.getElementById('mesesFaturas').value;
//     let valorPagamento = parseFloat(document.getElementById('valorPagamento').value);

//     if (!clienteId || !mes) {
//         alert('Selecione um cliente e um mês!');
//         return;
//     }

//     if (isNaN(valorPagamento) || valorPagamento <= 0) {
//         alert('Digite um valor válido para o pagamento.');
//         return;
//     }

//     try {
//         const clienteRef = doc(db, "clientes", clienteId);
//         const clienteSnap = await getDoc(clienteRef);

//         if (clienteSnap.exists()) {
//             const clienteData = clienteSnap.data();
//             const faturas = clienteData.faturas || {};

//             if (faturas[mes] && faturas[mes].length > 0) {
//                 let totalFatura = faturas[mes].reduce((acc, fatura) => {
//                     const valor = fatura.tipo === 'Compra' ? fatura.valor : 0;
//                     const pagamento = fatura.tipo === 'Pagamento' ? fatura.valor : 0;
//                     return acc + valor - pagamento;
//                 }, 0);

//                 if (valorPagamento > totalFatura) {
//                     alert('O valor do pagamento não pode ser maior que o total da fatura.');
//                     return;
//                 }

//                 faturas[mes].push({
//                     tipo: 'Pagamento',
//                     valor: valorPagamento,
//                     data: new Date().toLocaleString()
//                 });

//                 await updateDoc(clienteRef, { faturas });
//                 await mostrarFaturaDoMes(clienteId, mes);

//                 alert('Pagamento realizado com sucesso!');
//                 document.getElementById('pagarFaturaForm').reset();
//                 document.getElementById('pagarFaturaSection').style.display = 'none';
//             } else {
//                 alert('Não há faturas disponíveis para o mês selecionado.');
//             }
//         } else {
//             alert('Cliente não encontrado.');
//         }
//     } catch (error) {
//         console.error('Erro ao processar pagamento:', error);
//         alert('Erro ao processar o pagamento.');
//     }
// });




// document.getElementById('transferirSaldoForm').addEventListener('submit', async (event) => {
//     event.preventDefault();

//     const clienteId = document.getElementById('clienteConsulta').value;
//     const mesAtual = document.getElementById('mesesFaturas').value;
//     let valorTransferencia = parseFloat(document.getElementById('valorTransferencia').value);

//     if (isNaN(valorTransferencia) || valorTransferencia <= 0) {
//         alert('Valor de transferência inválido!');
//         return;
//     }

//     try {
//         const clienteRef = doc(db, "clientes", clienteId);
//         const clienteSnap = await getDoc(clienteRef);

//         if (clienteSnap.exists()) {
//             const clienteData = clienteSnap.data();
//             const faturas = clienteData.faturas || {};

//             if (faturas[mesAtual] && faturas[mesAtual].length > 0) {
//                 // Calcula o total da fatura atual
//                 let totalFatura = faturas[mesAtual].reduce((acc, fatura) => {
//                     const valor = fatura.tipo === 'Compra' ? fatura.valor : 0;
//                     const pagamento = fatura.tipo === 'Pagamento' ? fatura.valor : 0;
//                     return acc + valor - pagamento;
//                 }, 0);

//                 // Verifica se o valor da transferência é maior que o total da fatura
//                 if (valorTransferencia > totalFatura) {
//                     alert('O valor a ser transferido é maior que o saldo disponível!');
//                     return;
//                 }

//                 // Atualiza a fatura atual subtraindo o valor da transferência
//                 faturas[mesAtual].push({
//                     tipo: 'Transferência',  // Altera o tipo para 'Transferência'
//                     valor: valorTransferencia, // Deduz o valor transferido da fatura atual
//                     data: new Date().toLocaleString()
//                 });

//                 // Adiciona uma nova fatura para o próximo mês do tipo 'Compra'
//                 // Adiciona uma nova fatura para o próximo mês do tipo 'Compra'
// const proximoMes = getProximoMesNome(mesAtual);
// if (!faturas[proximoMes]) {
//     faturas[proximoMes] = [];
// }

// // Adiciona o valor positivo no próximo mês como uma nova fatura do tipo 'Compra'
// const valorComAcrescimo = valorTransferencia * 1.10; // 10% de acréscimo
// faturas[proximoMes].push({
//     tipo: 'Compra', // Define o tipo como 'Compra'
//     valor: valorComAcrescimo, // O valor da nova fatura é o mesmo da transferência
//     data: new Date().toLocaleString()
     
// });



//                 // Atualiza as faturas no banco de dados
//                 await updateDoc(clienteRef, { faturas });
//                 alert('Saldo transferido com sucesso!');

//                 // Reseta o formulário
//                 document.getElementById('transferirSaldoForm').reset();
//             } else {
//                 alert('Não há faturas disponíveis para o mês selecionado.');
//             }
//         } else {
//             alert('Cliente não encontrado.');
//         }
//     } catch (error) {
//         console.error('Erro ao transferir saldo:', error);
//         alert('Erro ao transferir saldo. Tente novamente.');
//     }
// });

// Função para confirmar o pagamento
document.getElementById('confirmarPagamento').addEventListener('click', async () => {
    const clienteId = document.getElementById('clienteConsulta').value;
    const mes = document.getElementById('mesesFaturas').value;
    let valorPagamento = parseFloat(document.getElementById('valorPagamentoModal').value);

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

            if (faturas[mes] && faturas[mes].length > 0) {
                let totalFatura = faturas[mes].reduce((acc, fatura) => {
                    const valor = fatura.tipo === 'Compra' ? fatura.valor : 0;
                    const pagamento = fatura.tipo === 'Pagamento' ? fatura.valor : 0;
                    return acc + valor - pagamento;
                }, 0);

                if (valorPagamento > totalFatura) {
                    alert('O valor do pagamento não pode ser maior que o total da fatura.');
                    return;
                }

                faturas[mes].push({
                    tipo: 'Pagamento',
                    valor: valorPagamento,
                    data: new Date().toLocaleString()
                });

                await updateDoc(clienteRef, { faturas });
                await mostrarFaturaDoMes(clienteId, mes);

                alert('Pagamento realizado com sucesso!');
                document.getElementById('pagarFaturaForm').reset();
                document.getElementById('modalPagar').style.display = 'none';
            } else {
                alert('Não há faturas disponíveis para o mês selecionado.');
            }
        } else {
            alert('Cliente não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        alert('Erro ao processar o pagamento.');
    }
});

// Função para confirmar a transferência de saldo
document.getElementById('confirmarTransferencia').addEventListener('click', async () => {
    const clienteId = document.getElementById('clienteConsulta').value;
    const mesAtual = document.getElementById('mesesFaturas').value;
    let valorTransferencia = parseFloat(document.getElementById('valorTransferenciaModal').value);

    if (isNaN(valorTransferencia) || valorTransferencia <= 0) {
        alert('Valor de transferência inválido!');
        return;
    }

    try {
        const clienteRef = doc(db, "clientes", clienteId);
        const clienteSnap = await getDoc(clienteRef);

        if (clienteSnap.exists()) {
            const clienteData = clienteSnap.data();
            const faturas = clienteData.faturas || {};

            if (faturas[mesAtual] && faturas[mesAtual].length > 0) {
                let totalFatura = faturas[mesAtual].reduce((acc, fatura) => {
                    const valor = fatura.tipo === 'Compra' ? fatura.valor : 0;
                    const pagamento = fatura.tipo === 'Pagamento' ? fatura.valor : 0;
                    return acc + valor - pagamento;
                }, 0);

                if (valorTransferencia > totalFatura) {
                    alert('O valor a ser transferido é maior que o saldo disponível!');
                    return;
                }

                faturas[mesAtual].push({
                    tipo: 'Transferência',
                    valor: valorTransferencia,
                    data: new Date().toLocaleString()
                });

                const proximoMes = getProximoMesNome(mesAtual);
                if (!faturas[proximoMes]) {
                    faturas[proximoMes] = [];
                }

                const valorComAcrescimo = valorTransferencia * 1.10;
                faturas[proximoMes].push({
                    tipo: 'Compra',
                    valor: valorComAcrescimo,
                    data: new Date().toLocaleString()
                });

                await updateDoc(clienteRef, { faturas });
                alert('Saldo transferido com sucesso!');

                document.getElementById('transferirSaldoForm').reset();
                document.getElementById('modalTransferir').style.display = 'none';
            } else {
                alert('Não há faturas disponíveis para o mês selecionado.');
            }
        } else {
            alert('Cliente não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao transferir saldo:', error);
        alert('Erro ao transferir saldo. Tente novamente.');
    }
});



// Chamadas para atualização dos selects na inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await atualizarSelectClientes();
    await atualizarSelectClientesCompra();
    await atualizarSelectClientesConsulta();
});


// ------------------------------------------------FIM DA SEÇÃO DE CONSULTAR CREDIARIO CLIENTE-------------------------------------








//----------------------------------------------- INICIO DA SEÇÃO DE VISUALIZAR CLIENTES--------------------------------------------

let clientes = []; // Variável global para armazenar os clientes

// Função para carregar todos os clientes do Firestore
async function carregarClientesBd() {
    const listaClientes = document.getElementById('listaClientes');
    listaClientes.innerHTML = ''; // Limpa a lista antes de carregar

    try {
        const querySnapshot = await getDocs(collection(db, "clientes"));
        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                const cliente = doc.data();
                cliente.id = doc.id; // Adiciona o id do documento ao objeto cliente
                clientes.push(cliente); // Armazena o cliente na variável global

                // Adiciona cliente à lista
                adicionarClienteNaLista(cliente);
            });
        } else {
            listaClientes.innerHTML = "<p>Nenhum cliente cadastrado.</p>";
        }
    } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        listaClientes.innerHTML = "<p>Erro ao carregar clientes. Tente novamente.</p>";
    }
}

// Função para adicionar um cliente na lista
function adicionarClienteNaLista(cliente) {
    const listaClientes = document.getElementById('listaClientes');
    const clienteDiv = document.createElement('div');
    clienteDiv.classList.add('cliente-item');
    clienteDiv.innerHTML = `
        <p><strong>Nome:</strong> ${cliente.nome}</p>
        <p><strong>Email:</strong> ${cliente.email}</p>
        <p><strong>Telefone:</strong> ${cliente.telefone}</p>
        <p><strong>CEP:</strong> ${cliente.cep || "Não informado"}</p>
        <p><strong>Endereço:</strong> ${cliente.endereco || "Não informado"}</p>
        <p><strong>Limite de Crédito:</strong> R$ ${cliente.limiteCredito.toFixed(2)}</p>
        <button onclick="editarCliente('${cliente.id}')">Editar</button>
        <button onclick="excluirCliente('${cliente.id}')">Excluir</button>
        <hr>
    `;
    listaClientes.appendChild(clienteDiv);
}

// Função para filtrar clientes
// Definindo as funções no escopo global
window.filtrarClientes = function () {
    const input = document.getElementById('buscaClientes').value.toLowerCase();
    const listaClientes = document.getElementById('listaClientes');
    listaClientes.innerHTML = ''; // Limpa a lista antes de filtrar

    // Primeiro, filtra os clientes que correspondem ao input
    const clientesFiltrados = clientes.filter(cliente => 
        cliente.nome.toLowerCase().includes(input)
    );

    // Depois, adiciona os clientes filtrados na lista
    if (clientesFiltrados.length > 0) {
        clientesFiltrados.forEach(cliente => {
            adicionarClienteNaLista(cliente); // Adiciona cliente filtrado na lista
        });
    } else {
        listaClientes.innerHTML = "<p>Nenhum cliente encontrado.</p>";
    }

    // Adiciona os clientes que não correspondem ao filtro (não exibidos) abaixo dos filtrados
    const clientesRestantes = clientes.filter(cliente => 
        !cliente.nome.toLowerCase().includes(input)
    );

    // Adiciona os clientes restantes na lista
    clientesRestantes.forEach(cliente => {
        adicionarClienteNaLista(cliente);
    });
};

// Chame essa função quando a seção de visualizar clientes for exibida
carregarClientesBd();


// Definindo as funções no escopo global
window.editarCliente = async function (clienteId) {
    try {
        const clienteRef = doc(db, "clientes", clienteId);
        const clienteSnap = await getDoc(clienteRef);

        if (clienteSnap.exists()) {
            const clienteData = clienteSnap.data();

            // Preenche os campos do formulário do modal com os dados do cliente para edição
            document.getElementById("nomeModal").value = clienteData.nome;
            document.getElementById("emailModal").value = clienteData.email;
            document.getElementById("telefoneModal").value = clienteData.telefone;
            document.getElementById("cepModal").value = clienteData.cep || "";
            document.getElementById("enderecoModal").value = clienteData.endereco || "";
            document.getElementById("limiteCreditoModal").value = clienteData.limiteCredito;

            // Define um ID para o cliente em edição
            document.getElementById("clienteIdModal").value = clienteId;

            // Abre o modal
            document.getElementById("modalEditarCliente").style.display = "block";
        }
    } catch (error) {
        console.error("Erro ao carregar cliente para edição:", error);
    }
}

// Definindo fecharModal no escopo global
window.fecharModal = function() {
    document.getElementById("modalEditarCliente").style.display = "none";
}

// Fechar o modal quando o usuário clicar fora do conteúdo do modal
window.onclick = function(event) {
    const modal = document.getElementById("modalEditarCliente");
    if (event.target === modal) {
        fecharModal(); // Agora deve funcionar sem erros
    }
}




// Definindo a função no escopo global
window.salvarEdicao = async function (event) {
    event.preventDefault(); // Previne o envio do formulário
    const clienteId = document.getElementById("clienteIdModal").value;

    // Coletar os dados do formulário
    const clienteAtualizado = {
        nome: document.getElementById("nomeModal").value,
        email: document.getElementById("emailModal").value,
        telefone: document.getElementById("telefoneModal").value,
        cep: document.getElementById("cepModal").value,
        endereco: document.getElementById("enderecoModal").value,
        limiteCredito: parseFloat(document.getElementById("limiteCreditoModal").value)
    };

    console.log("Atualizando cliente:", clienteAtualizado); // Log dos dados coletados

    try {
        // Atualiza os dados no Firestore
        await setDoc(doc(db, "clientes", clienteId), clienteAtualizado, { merge: true });
        alert("Cliente atualizado com sucesso!");

        // Fecha o modal
        fecharModal();

        // Recarrega a lista de clientes
        carregarClientesBd();
    } catch (error) {
        console.error("Erro ao atualizar cliente:", error);
        alert("Erro ao atualizar cliente. Tente novamente."); // Mensagem de erro visível
    }
}




window.excluirCliente = async function (clienteId) {
    const confirmar = confirm("Tem certeza de que deseja excluir este cliente?");
    if (confirmar) {
        try {
            await deleteDoc(doc(db, "clientes", clienteId));
            alert("Cliente excluído com sucesso!");
            carregarClientesBd(); // Recarrega a lista de clientes
        } catch (error) {
            console.error("Erro ao excluir cliente:", error);
            alert("Erro ao excluir cliente.");
        }
    }
}

// Event listener para o botão "Visualizar Clientes"
document.getElementById('menuVisualizar').addEventListener('click', () => {
    document.getElementById('visualizarClientesSection').style.display = 'block';
    document.getElementById('cadastroSection').style.display = 'none';
    document.getElementById('editarSection').style.display = 'none';
    document.getElementById('excluirSection').style.display = 'none';
    document.getElementById('compraSection').style.display = 'none';
    document.getElementById('consultaSection').style.display = 'none';
    
});

//----------------------------------------- FIM DA SEÇÃO DE CONSULTAR CREDIARIO CLIENTE-------------------------------------------------



// Seleciona todos os links de navegação
const navLinks = document.querySelectorAll('.nav-link');

// Adiciona um evento de clique a cada link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Remove a classe 'active' de todos os links
        navLinks.forEach(nav => nav.classList.remove('active'));
        
        // Adiciona a classe 'active' ao link clicado
        link.classList.add('active');
    });
});
