const SUPABASE_URL = 'https://wvithsajytvhsazxmgaj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2aXRoc2FqeXR2aHNhenhtZ2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTQ1MTgsImV4cCI6MjA3NjczMDUxOH0.gIFxHbvUBfrrWffRSNjaW4CCtykqOQoeiL4l7WQpsjA'; 

const ADMIN_EMAIL = 'admincake@gmail.com';

let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Cliente Supabase inicializado com sucesso.");
} else {
    console.warn("AVISO: SDK Supabase não carregado. Login/Cadastro/Checkout REAL estarão desativados.");
}

let cart = [];
const DELIVERY_FEE = 5.00; 

function showToast(message, type = 'success') {
    if (typeof Toastify !== 'function') return; 
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: type === 'success' ? '#014926' : '#b96d5c',
        },
    }).showToast();
}
function formatCurrency(value) {
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return "R$ 0,00";
    return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function saveCartToStorage() {
    try { localStorage.setItem("bitcake_cart", JSON.stringify(cart)); } 
    catch (e) { console.error("Erro ao salvar carrinho:", e); }
}
function getCartFromStorage() {
    try {
        const storedCart = localStorage.getItem("bitcake_cart");
        if (storedCart) {
            const parsed = JSON.parse(storedCart);
            return Array.isArray(parsed) ? parsed : []; 
        }
    } catch (e) { console.error("Erro ao ler carrinho:", e); }
    return []; 
}
function generateRandomPixKey() {
    return `bitcake-${Math.random().toString(36).substring(2, 12)}@simulado.com`;
}

document.addEventListener('DOMContentLoaded', () => {

   
    const menu = document.getElementById("menu"); 
    const cartBtn = document.getElementById("cart-btn");
    const cartModal = document.getElementById("cart-modal");
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const checkoutBtn = document.getElementById("checkout-btn"); 
    const closeModalBtn = document.getElementById("close-modal-btn");
    const cartCounter = document.getElementById("cart-count");

    
    cart = getCartFromStorage(); 
    if (cartItemsContainer && cartTotal && cartCounter) {
        updateCartModal(); 
    }

    
    function propagateRedirectParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTarget = urlParams.get('redirect');

        if (redirectTarget) {
            const registerLink = document.querySelector('a[href="cadastro.html"]');
            if (registerLink) {
                registerLink.href = `cadastro.html?redirect=${encodeURIComponent(redirectTarget)}`; 
            }
            const loginLink = document.querySelector('a[href="login.html"]');
            if (loginLink) {
                loginLink.href = `login.html?redirect=${encodeURIComponent(redirectTarget)}`;
            }
        }
    }
    propagateRedirectParam();

    // ★★★ INÍCIO DA NOVA FUNÇÃO (OLHO MÁGICO) ★★★
    function setupPasswordToggle(toggleButtonId, passwordInputId) {
        const toggleButton = document.getElementById(toggleButtonId);
        const passwordInput = document.getElementById(passwordInputId);
        
        if (!toggleButton || !passwordInput) {
            // Se os elementos não existirem na página atual, não faz nada
            return;
        }

        toggleButton.addEventListener('click', () => {
            // Verifica o tipo atual do input
            const isPassword = passwordInput.type === 'password';
            
            if (isPassword) {
                // Se for senha, muda para texto
                passwordInput.type = 'text';
                // Muda o ícone para "olho cortado"
                toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>'; 
                toggleButton.setAttribute('aria-label', 'Esconder senha');
            } else {
                // Se for texto, muda para senha
                passwordInput.type = 'password';
                // Muda o ícone de volta para "olho"
                toggleButton.innerHTML = '<i class="fas fa-eye"></i>'; 
                toggleButton.setAttribute('aria-label', 'Mostrar senha');
            }
        });
    }
    // ★★★ FIM DA NOVA FUNÇÃO ★★★


    // LÓGICA DE CADASTRO
    const registerForm = document.getElementById('register-form');
    if (registerForm && supabaseClient) {
        
        // ★★★ CHAMA A FUNÇÃO PARA A PÁGINA DE CADASTRO ★★★
        setupPasswordToggle('toggle-register-password', 'register-password');

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            // ★★★ CAPTURA O TELEFONE ★★★
            const phone = document.getElementById('register-phone').value;

            const urlParams = new URLSearchParams(window.location.search);
            const redirectTo = urlParams.get('redirect'); 
            const loginUrl = redirectTo ? `login.html?redirect=${encodeURIComponent(redirectTo)}` : 'login.html'; 

            // 1. Cadastra o usuário no Supabase Auth
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({ email, password });

            if (authError) {
                return showToast(`Erro no cadastro: ${authError.message}`, 'error');
            }

            // 2. Cria a entrada na tabela 'Perfis'
            if (authData.user) {
                // ★★★ SALVA O TELEFONE NO PERFIL ★★★
                const { error: profileError } = await supabaseClient.from('Perfis').insert([
                    { id: authData.user.id, nome_usuario: name, telefone: phone }
                ]);

                if (profileError) {
                    console.error("Erro ao criar perfil:", profileError);
                    return showToast("Erro interno ao finalizar seu perfil.", 'error');
                }
                
                showToast("Cadastro realizado! Por favor, faça login.");
                setTimeout(() => { window.location.href = loginUrl; }, 1500);
            }
        });
    }

    // LÓGICA DE LOGIN 
    const loginForm = document.getElementById('login-form');
    if (loginForm && supabaseClient) {

        // ★★★ CHAMA A FUNÇÃO PARA A PÁGINA DE LOGIN ★★★
        setupPasswordToggle('toggle-login-password', 'login-password');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const urlParams = new URLSearchParams(window.location.search);
            const redirectTo = urlParams.get('redirect') || 'index.html'; 

            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

            if (error) {
                showToast(`Erro no login: ${error.message}`, 'error');
            } else {
                showToast("Login realizado com sucesso!");
                setTimeout(() => { window.location.href = redirectTo; }, 1000);
            }
        });
    }


    // LÓGICA DO CARRINHO 
    if (cartBtn && cartModal && closeModalBtn && menu && checkoutBtn && cartItemsContainer) {
        
        cartBtn.addEventListener("click", () => {
            updateCartModal();
            cartModal.style.display = "flex";
        });
        closeModalBtn.addEventListener("click", () => { cartModal.style.display = "none"; });
        cartModal.addEventListener("click", (event) => { if(event.target === cartModal) cartModal.style.display = "none"; });
        
        // Adicionar ao carrinho
        menu.addEventListener("click", (event) => {
            let parentButton = event.target.closest(".add-to-cart");
            if(parentButton) {
                const name = parentButton.getAttribute("data-name");
                const price = parseFloat(parentButton.getAttribute("data-price"));
                if (name && !isNaN(price)) addToCart(name, price);
            }
        });
        // Remover do carrinho
        cartItemsContainer.addEventListener("click", (event) => {
            if(event.target.classList.contains("remove-from-cart-btn")) {
                const name = event.target.getAttribute("data-name");
                if (name) removeItemCart(name);
            }
        });
        
        // Listener do botão "Continuar para Pagamento" 
        checkoutBtn.addEventListener("click", async () => {
            if(cart.length === 0) {
                showToast("Adicione itens ao carrinho!", 'error');
                return;
            }
            
            saveCartToStorage();
            
            // VERIFICA SE ESTÁ LOGADO PARA PULAR A TELA DE LOGIN
            if (supabaseClient) {
                const { data: { user } } = await supabaseClient.auth.getUser();
                
                if (user) {
                    // USUÁRIO LOGADO: Vai direto para o checkout de vendas
                    window.location.href = "vendas.html"; 
                    return;
                }
            }
            
            // USUÁRIO DESLOGADO OU SUPABASE INATIVO: Vai para a página de login
            window.location.href = "login.html?redirect=vendas.html"; 
        });

    }

    function addToCart(name, price) {
        const existingItem = cart.find(item => item.name === name);
        if(existingItem) existingItem.quantity += 1;
        else cart.push({ name, price, quantity: 1 });
        saveCartToStorage(); 
        updateCartModal(); 
        showToast(`${name} adicionado!`);
    }

    function updateCartModal() {
        if (!cartItemsContainer || !cartTotal || !cartCounter) return;
        cartItemsContainer.innerHTML = "";
        let total = 0;
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center text-gray-500">Seu carrinho está vazio.</p>';
        } else {
            cart.forEach(item => {
                const itemSubtotal = (item.price || 0) * (item.quantity || 0);
                const cartItemElement = document.createElement("div");
                cartItemElement.classList.add("flex", "justify-between", "items-center", "mb-3", "pb-2", "border-b");
                cartItemElement.innerHTML = `<div class="flex-grow pr-2"><p class="font-bold">${item.name || '?'}</p><p class="text-sm">Quantidade: ${item.quantity||0}</p><p class="font-medium mt-1">${formatCurrency(itemSubtotal)}</p></div><button class="remove-from-cart-btn bg-red-500 text-white px-2 py-1 rounded text-xs" data-name="${item.name||''}">Remover</button>`;
                total += itemSubtotal;
                cartItemsContainer.appendChild(cartItemElement);
            });
        }
        cartTotal.textContent = formatCurrency(total);
        cartCounter.textContent = cart.length;
    }
    
    function removeItemCart(name) {
        cart = cart.filter(item => item.name !== name); 
        saveCartToStorage();
        updateCartModal();
        showToast(`${name} removido.`, 'warning');
    }

    // PERFIL (Página: index.html)
    
    if (document.URL.includes("index.html") || window.location.pathname === '/') {
        
        const userLink = document.getElementById('user-link');
        // Novos elementos do Modal
        const profileModal = document.getElementById('profile-modal');
        const profileModalContent = document.getElementById('profile-modal-content');
        const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
        const profileNameEl = document.getElementById('profile-name');
        const profileAddressEl = document.getElementById('profile-address');
        const recentOrdersList = document.getElementById('recent-orders-list');
        const viewAllOrdersBtn = document.getElementById('view-all-orders-btn'); // Note: This ID is not in index.html, but code exists.
        const profileLogoutBtn = document.getElementById('profile-logout-btn');

        async function loadProfileData(user) {
            if (!user || !supabaseClient) return;

            // MODIFICADO: LÓGICA DO LINK ADMIN ADICIONADA AQUI
            const adminPanelLink = document.getElementById('admin-panel-link');
            if (adminPanelLink) {
                adminPanelLink.classList.toggle('hidden', user.email !== ADMIN_EMAIL);
            }
            // FIM DA LÓGICA DO LINK ADMIN

            const userId = user.id;

            // Busca Nome do Usuário
            const { data: profileData } = await supabaseClient
                .from('Perfis')
                .select('nome_usuario')
                .eq('id', userId)
                .single();

            if (profileData && profileNameEl) {
                // EXIBE O NOME COMPLETO DO CADASTRO (CORREÇÃO APLICADA AQUI)
                profileNameEl.textContent = profileData.nome_usuario || 'Cliente'; 
            }

            // Busca Endereço Padrão
            const { data: addressData } = await supabaseClient
                .from('enderecos')
                .select('endereco_completo')
                .eq('user_id', userId) 
                .eq('padrao', true)
                .single();
            
            if (profileAddressEl) {
                profileAddressEl.textContent = addressData ? addressData.endereco_completo : 'Nenhum endereço padrão salvo. Adicione no checkout!';
            }

            // Busca Pedidos Recentes (Limite 3)
            const { data: ordersData } = await supabaseClient
                .from('pedidos_v2')
                .select('id, data_pedido, valor_total, status')
                .eq('user_id', userId)
                .order('data_pedido', { ascending: false })
                .limit(3);

            if (recentOrdersList) {
                recentOrdersList.innerHTML = ''; // Limpa antes de popular
                if (ordersData && ordersData.length > 0) {
                    ordersData.forEach(pedido => {
                        const statusClass = pedido.status ? pedido.status.replace(/\s/g, '') : 'Recebido'; 
                        
                        // ★★★ LINHA CORRIGIDA PARA EVITAR O CRASH ★★★
                        const dataFormatada = new Date(pedido.data_pedido).toLocaleString('pt-BR');

                        const orderElement = document.createElement('div');
                        orderElement.classList.add('flex', 'justify-between', 'items-center', 'p-3', 'bg-white', 'rounded-lg', 'border', 'shadow-sm');
                        orderElement.innerHTML = `
                            <div>
                                <p class="font-bold text-gray-800">Pedido #${pedido.id}</p>
                                <p class="text-sm text-gray-500">${dataFormatada}</p>
                            </div>
                            <div class="text-right">
                                <span class="status-badge status-${statusClass} text-xs font-semibold">${pedido.status}</span>
                                <p class="font-bold text-[#b96d5c]">${formatCurrency(pedido.valor_total)}</p>
                            </div>
                        `;
                        recentOrdersList.appendChild(orderElement);
                    });
                } else {
                    recentOrdersList.innerHTML = '<p class="text-gray-500 italic">Nenhum pedido recente encontrado.</p>';
                }
            }
        }
        
        // Função para abrir o modal de perfil e carregar os dados
        async function updateAuthLink() {
            if (!userLink || !supabaseClient) return;

            // Remove o listener anterior para evitar duplicidade
            userLink.replaceWith(userLink.cloneNode(true));
            const newLink = document.getElementById('user-link');
            const { data: { user } } = await supabaseClient.auth.getUser();

            if (user) {
                // Usuário logado: Abrir Modal
                newLink.href = '#'; 
                newLink.title = 'Minha Conta / Ver Perfil';
                newLink.classList.add('text-[#10b981]');
                newLink.classList.remove('text-white');
                
                // Adiciona o listener para ABRIR O MODAL DO PERFIL
                newLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (profileModal && profileModalContent) {
                        loadProfileData(user); // Carrega dados na abertura
                        profileModal.classList.remove('hidden');
                        profileModal.classList.add('flex');
                        // Aplica transição para um efeito suave
                        setTimeout(() => { 
                            profileModal.style.opacity = '1';
                            profileModalContent.style.transform = 'scale(1)';
                            profileModalContent.style.opacity = '1';
                        }, 10);
                    }
                });

            } else {
                // Usuário deslogado: Redirecionar para Login
                newLink.href = 'login.html';
                newLink.title = 'Fazer Login / Criar Conta';
                newLink.classList.add('text-white');
                newLink.classList.remove('text-[#10b981]');
            }
        }
        
        // Listeners para Fechar o Modal
        if (closeProfileModalBtn && profileModal && profileModalContent) {
            const closeProfileModal = () => {
                // Inicia transição de fechamento
                profileModalContent.style.transform = 'scale(0.95)';
                profileModalContent.style.opacity = '0';
                profileModal.style.opacity = '0';
                // Esconde após o fim da transição
                setTimeout(() => {
                    profileModal.classList.remove('flex');
                    profileModal.classList.add('hidden');
                }, 300); 
            };

            closeProfileModalBtn.addEventListener('click', closeProfileModal);
            profileModal.addEventListener('click', (event) => {
                if(event.target === profileModal) closeProfileModal();
            });
        }
        
        // Listener do botão Ver Todo Histórico
        if (viewAllOrdersBtn) {
             viewAllOrdersBtn.addEventListener('click', () => {
                window.location.href = 'meus_pedidos.html'; // Redireciona para a página de histórico completo
             });
        }
        
        // Listener de Logout (dentro do modal)
        if (profileLogoutBtn) {
            profileLogoutBtn.addEventListener('click', async () => {
                if (supabaseClient) {
                    const { error } = await supabaseClient.auth.signOut();
                    if (error) {
                        showToast("Erro ao sair.", 'error');
                    } else {
                        showToast("Sessão encerrada com sucesso.");
                        setTimeout(() => { window.location.href = 'index.html'; }, 1000); 
                    }
                } else {
                    showToast("Logout simulado.", 'success');
                    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                }
            });
        }


        // Chamada inicial e listener para mudanças de sessão
        updateAuthLink();
        supabaseClient.auth.onAuthStateChange(() => {
            updateAuthLink();
        });
    }

    // LÓGICA DE PERFIL E CHECKOUT (Página: vendas.html)
    
    if (document.URL.includes("vendas.html")) {
        // Elementos DOM (vendas.html) 
        const orderSummaryDiv = document.getElementById('order-summary');
        const summarySubtotal = document.getElementById('summary-subtotal');
        const summaryDelivery = document.getElementById('summary-delivery');
        const summaryTotal = document.getElementById('summary-total');
        const finalizeOrderBtn = document.getElementById('finalize-order-btn');
        // ★★★ NOVOS ELEMENTOS DO VENDAS.HTML ★★★
        const phoneInput = document.getElementById('phone-input');
        const phoneWarn = document.getElementById('phone-warn');
        const addressInput = document.getElementById('address-input');
        const addressWarn = document.getElementById('address-warn');
        // ★★★ NOVO AVISO DE CIDADE ★★★
        const addressCityWarn = document.getElementById('address-city-warn');
        // ★★★ FIM DA MODIFICAÇÃO ★★★
        const paymentOptionsElements = document.querySelectorAll('input[name="payment-method"]');
        const detailsCartao = document.getElementById('details-cartao');
        const detailsPix = document.getElementById('details-pix');
        const pixKeyDisplay = document.getElementById('pix-key-display');
        const copyPixBtn = document.getElementById('copy-pix-btn');
        const trocoInput = document.getElementById('troco-input');

        // FUNÇÃO PRINCIPAL: Carrega o carrinho e os dados do usuário
        async function loadCartAndUserData() {
            const cartData = getCartFromStorage();
            let subtotal = 0;
            
            // 1. Carregar Resumo do Pedido e Cálculo
            if (orderSummaryDiv) {
                if (cartData.length === 0) {
                    orderSummaryDiv.innerHTML = '<p class="text-red-500 font-bold">Seu carrinho está vazio! Volte ao cardápio.</p>';
                    if(finalizeOrderBtn) finalizeOrderBtn.disabled = true;
                    return;
                }
                let summaryHTML = '<ul class="space-y-1">'; 
                cartData.forEach(item => {
                    const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity || 0));
                    subtotal += itemTotal;
                    summaryHTML += `<li class="flex justify-between text-gray-700"><span>${item.name || '?'} <span class="text-xs">(${item.quantity}x)</span></span><span class="font-medium">${formatCurrency(itemTotal)}</span></li>`;
                });
                summaryHTML += '</ul>';
                const total = subtotal + DELIVERY_FEE;
                orderSummaryDiv.innerHTML = summaryHTML;
                if (summarySubtotal) summarySubtotal.textContent = formatCurrency(subtotal);
                if (summaryDelivery) summaryDelivery.textContent = formatCurrency(DELIVERY_FEE);
                if (summaryTotal) summaryTotal.textContent = formatCurrency(total);
                if (finalizeOrderBtn) finalizeOrderBtn.disabled = false;
            }

            // 2. Carregar Dados Salvos do Perfil (Somente se o Supabase estiver ativo)
            if (supabaseClient) {
                const { data: { user } } = await supabaseClient.auth.getUser();

                if (!user) {
                    showToast("Login necessário para carregar dados salvos.", 'error');
                    setTimeout(() => { window.location.href = 'login.html?redirect=vendas.html'; }, 1500);
                    return;
                }
                
                const userId = user.id;

                // A. Busca Preferência de Pagamento E TELEFONE
                const { data: perfil } = await supabaseClient
                    .from('Perfis')
                    .select('pref_pagamento, telefone') // ★★★ BUSCA O TELEFONE ★★★
                    .eq('id', userId)
                    .single();

                if (perfil) {
                    if (perfil.pref_pagamento) {
                        const radio = document.querySelector(`input[name="payment-method"][value="${perfil.pref_pagamento}"]`);
                        if (radio) radio.checked = true;
                    }
                    // ★★★ POPULA O CAMPO DE TELEFONE ★★★
                    if (perfil.telefone && phoneInput) {
                        phoneInput.value = perfil.telefone;
                    }
                }

                // B. Busca Endereço Padrão
                const { data: endereco } = await supabaseClient
                    .from('enderecos')
                    .select('endereco_completo, observacoes')
                    .eq('user_id', userId) 
                    .eq('padrao', true) 
                    .single();
                
                if (endereco) {
                    if (addressInput) addressInput.value = endereco.endereco_completo || '';
                    if (document.getElementById('notes-input')) document.getElementById('notes-input').value = endereco.observacoes || '';
                }
            }
            
            // 3. Garante que os listeners sejam aplicados APÓS o carregamento dos dados
            setupPaymentListeners();
        }

        // Setup dos Listeners de Pagamento
        function setupPaymentListeners() {
            paymentOptionsElements.forEach(option => {
                option.addEventListener('change', function() {
                    if (detailsCartao) detailsCartao.classList.add('hidden');
                    if (detailsPix) detailsPix.classList.add('hidden');
                    if (copyPixBtn) copyPixBtn.disabled = true;
                    document.querySelectorAll('#details-cartao input').forEach(inp => inp.required = false);

                    if (this.value === 'Cartão' && detailsCartao) {
                        detailsCartao.classList.remove('hidden');
                        document.querySelectorAll('#details-cartao input').forEach(inp => inp.required = true);
                    } else if (this.value === 'Pix' && detailsPix) {
                        detailsPix.classList.remove('hidden');
                        if (pixKeyDisplay && pixKeyDisplay.textContent.includes('Selecione Pix')) { 
                            pixKeyDisplay.textContent = generateRandomPixKey();
                        }
                        if (copyPixBtn) copyPixBtn.disabled = false; 
                    }
                    
                    // Aplica a classe hover/checked para melhor UX
                    document.querySelectorAll('.payment-option').forEach(div => div.classList.remove('has-[:checked]:ring-2', 'has-[:checked]:ring-[#b96d5c]/30'));
                    this.closest('.payment-option').classList.add('has-[:checked]:ring-2', 'has-[:checked]:ring-[#b96d5c]/30');
                });
            });
            // Dispara o evento 'change' no rádio que está checado (se houver) para abrir o painel correto.
            const checkedRadio = document.querySelector('input[name="payment-method"]:checked');
            if(checkedRadio) checkedRadio.dispatchEvent(new Event('change'));

            // Lógica de copiar chave PIX
            if (copyPixBtn && pixKeyDisplay) {
                copyPixBtn.addEventListener('click', () => {
                    if (pixKeyDisplay.textContent && !pixKeyDisplay.textContent.includes('Selecione Pix')) {
                        navigator.clipboard.writeText(pixKeyDisplay.textContent)
                            .then(() => showToast("Chave PIX copiada!"))
                            .catch(err => showToast("Erro ao copiar.", 'error'));
                    }
                });
            }
        }
        
        // Listener de Finalização do Pedido (Salva Prefs e Envia o Pedido)
        if (finalizeOrderBtn) {
            finalizeOrderBtn.addEventListener('click', async function(event) {
                event.preventDefault(); 
                
                // Validações
                const cartData = getCartFromStorage();
                const deliveryPhone = phoneInput ? phoneInput.value.trim() : '';
                const deliveryAddress = addressInput ? addressInput.value.trim() : '';
                const notes = document.getElementById('notes-input')?.value;
                const selectedPaymentRadio = document.querySelector('input[name="payment-method"]:checked');

                // ★★★ INÍCIO DO BLOCO DE VALIDAÇÃO MODIFICADO ★★★
                // 1. Reseta todos os avisos
                if(addressWarn) addressWarn.classList.add('hidden');
                if(phoneWarn) phoneWarn.classList.add('hidden');
                if(addressCityWarn) addressCityWarn.classList.add('hidden');

                // 2. Valida campos vazios
                if (cartData.length === 0 || deliveryAddress === '' || deliveryPhone === '' || !selectedPaymentRadio) {
                    if (addressWarn && deliveryAddress === '') addressWarn.classList.remove('hidden');
                    if (phoneWarn && deliveryPhone === '') phoneWarn.classList.remove('hidden'); 
                    showToast("Preencha todos os campos obrigatórios.", 'error'); 
                    return;
                }
                
                // 3. Valida a cidade (convertendo para minúsculas)
                const targetCity = "cataguases";
                if (!deliveryAddress.toLowerCase().includes(targetCity)) {
                    if (addressCityWarn) addressCityWarn.classList.remove('hidden'); // Mostra o aviso da cidade
                    showToast("Endereço fora da área de entrega.", 'error');
                    return; // Para a execução
                }
                // ★★★ FIM DO BLOCO DE VALIDAÇÃO ★★★
                
                const selectedPaymentValue = selectedPaymentRadio.value;
                const finalSubtotal = cartData.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
                const finalTotal = finalSubtotal + DELIVERY_FEE;
                
                let orderDetailsId = null; 

                // ENVIO E SALVAMENTO DE DADOS (Supabase)
                if (supabaseClient) { 
                    const { data: { user } } = await supabaseClient.auth.getUser(); 
                    if (!user) { window.location.href = 'login.html?redirect=vendas.html'; return; }
                    
                    // A. Salva/Atualiza Endereço e Obtém o ID do Endereço
                    const { data: addressData, error: addressError } = await supabaseClient
                        .from('enderecos')
                        .upsert({
                            user_id: user.id, // USANDO user_id
                            endereco_completo: deliveryAddress,
                            observacoes: notes,
                            padrao: true
                        }, { 
                            onConflict: 'user_id', // USANDO user_id
                            ignoreDuplicates: false 
                        })
                        .select('id')
                        .single();

                    if (addressError || !addressData) {
                        showToast("Erro ao salvar endereço. Verifique RLS.", 'error');
                        console.error("Erro Endereço:", addressError);
                        return;
                    }
                    orderDetailsId = addressData.id;

                    // B. Salva a Preferência de Pagamento E TELEFONE
                    const { error: prefError } = await supabaseClient
                        .from('Perfis')
                        .update({ 
                            pref_pagamento: selectedPaymentValue,
                            telefone: deliveryPhone // ★★★ ATUALIZA O TELEFONE ★★★
                        })
                        .eq('id', user.id);

                    if (prefError) {
                        showToast("Erro ao salvar pref. pagamento.", 'error');
                        console.error("Erro Pref Pagamento:", prefError);
                        return;
                    }

                    // C. Insere o Pedido (usando a tabela pedidos_v2)
                    const pedidoToInsert = {
                        user_id: user.id, // USANDO user_id
                        valor_total: finalTotal,
                        status: 'Recebido',
                        detalhes_itens: cartData, // O JSONB é perfeito para isso
                        endereco_id: orderDetailsId // ID do endereço salvo
                    };
                    
                    const { data: insertedOrder, error: insertError } = await supabaseClient
                        .from('pedidos_v2') // USANDO A TABELA CORRETA
                        .insert([pedidoToInsert]) 
                        .select('id')
                        .single();

                    if (insertError) {
                        showToast(`Erro ao finalizar: ${insertError.message}`, 'error');
                        console.error("Erro Pedido:", insertError);
                        return;
                    }

                    // Sucesso!
                    showToast(`Pedido #${insertedOrder.id} finalizado!`);
                    localStorage.removeItem('bitcake_cart'); 
                    setTimeout(() => { window.location.href = 'index.html'; }, 2000);
                } else { 
                    // --- Simulação (Fallback) ---
                    alert(`Simulação: Pedido de ${formatCurrency(finalTotal)} enviado para ${deliveryAddress}.`);
                    localStorage.removeItem('bitcake_cart'); 
                    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                }
            });
        }
        
        loadCartAndUserData();
    } 

    // 5. LÓGICA DA PÁGINA "MEUS PEDIDOS" (meus_pedidos.html)

    if (document.URL.includes("meus_pedidos.html")) {
        const pedidosList = document.getElementById('pedidos-list');
        const logoutBtn = document.getElementById('logout-btn');

        // Função de Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (supabaseClient) {
                    const { error } = await supabaseClient.auth.signOut();
                    if (error) {
                        showToast("Erro ao sair.", 'error');
                    } else {
                        showToast("Sessão encerrada com sucesso.");
                        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                    }
                } else {
                    showToast("Logout simulado.", 'success');
                    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                }
            });
        }

        // Função para carregar e exibir os pedidos
        async function carregarPedidos() {
            if (!pedidosList) {
                console.error("Elemento 'pedidos-list' não encontrado.");
                return;
            }
            if (!supabaseClient) {
                pedidosList.innerHTML = '<p class="text-red-500 font-bold">Conexão Supabase ausente. Não foi possível carregar o histórico.</p>';
                return;
            }
            
            // Garantir que a mensagem de carregamento apareça enquanto espera
            pedidosList.innerHTML = '<div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200"><p class="text-center text-gray-500 font-medium"><i class="fas fa-spinner fa-spin mr-2"></i> Carregando histórico de pedidos...</p></div>';


            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                showToast("Sua sessão expirou. Faça login novamente.", 'error');
                setTimeout(() => { window.location.href = 'login.html?redirect=meus_pedidos.html'; }, 1500);
                return;
            }

            // Busca os pedidos do usuário na tabela pedidos_v2
            const { data: pedidos, error } = await supabaseClient
                .from('pedidos_v2')
                .select(`
                    id, 
                    data_pedido, 
                    valor_total, 
                    status, 
                    detalhes_itens,
                    enderecos (endereco_completo) 
                `)
                .eq('user_id', user.id) // USANDO user_id
                .order('data_pedido', { ascending: false });

            if (error) {
                console.error("Erro ao buscar pedidos:", error);
                pedidosList.innerHTML = `<p class="text-red-500 font-bold">Erro ao carregar pedidos: ${error.message}</p>`;
                return;
            }

            if (pedidos.length === 0) {
                pedidosList.innerHTML = '<p class="text-center text-gray-700 font-medium pt-4">Você ainda não realizou nenhum pedido.</p>';
                return;
            }

            pedidosList.innerHTML = ''; // Limpa a mensagem de carregamento

            pedidos.forEach(pedido => {
                // Garante que o status não tenha espaços para a classe CSS funcionar
                const statusClass = pedido.status ? pedido.status.replace(/\s/g, '') : 'Recebido'; 
                
                // ★★★ LINHA CORRIGIDA PARA EVITAR O CRASH ★★★
                const dataFormatada = new Date(pedido.data_pedido).toLocaleString('pt-BR');
                
                // Renderiza a lista de itens comprados
                const itensList = (pedido.detalhes_itens || [])
                    .map(item => `<li class="ml-4">${item.quantity}x ${item.name} (${formatCurrency(item.price)})</li>`)
                    .join('');
                
                // Endereço (navega pelo relacionamento)
                const endereco = pedido.enderecos ? pedido.enderecos.endereco_completo : 'Endereço não registrado.';

                const pedidoCard = document.createElement('div');
                pedidoCard.classList.add('bg-white', 'p-6', 'rounded-lg', 'shadow-lg', 'border', 'border-gray-200');
                pedidoCard.innerHTML = `
                    <div class="flex justify-between items-start mb-4 border-b pb-3">
                        <h3 class="text-xl font-bold text-[#b96d5c]">Pedido #${pedido.id}</h3>
                        <span class="status-badge status-${statusClass}">${pedido.status}</span>
                    </div>
                    
                    <p class="text-sm text-gray-500 mb-3">Realizado em: ${dataFormatada}</p>
                    
                    <div class="mb-4">
                        <p class="font-semibold text-gray-800">Itens Comprados:</p>
                        <ul class="list-disc text-gray-600 text-sm mt-1 space-y-1">
                            ${itensList}
                        </ul>
                    </div>
                    
                    <div class="mb-4 pt-3 border-t border-gray-100">
                        <p class="font-semibold text-gray-800">Entrega:</p>
                        <p class="text-sm text-gray-600">${endereco}</p>
                    </div>

                    <div class="text-right pt-2 border-t border-gray-300">
                        <p class="text-2xl font-extrabold text-[#014926]">Total: ${formatCurrency(pedido.valor_total)}</p>
                    </div>
                `;
                pedidosList.appendChild(pedidoCard);
            });
        }

        carregarPedidos();
    }
    
    // 6. LÓGICA DA PÁGINA "ADMIN" (admin.html) - ADICIONADO
    
    if (document.URL.includes("admin.html")) {
        const adminPedidosList = document.getElementById('admin-pedidos-list');
        const adminLoading = document.getElementById('admin-loading');
        const adminLogoutBtn = document.getElementById('admin-logout-btn');
        
        // Botão de Logout
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', async () => {
                if (supabaseClient) {
                    const { error } = await supabaseClient.auth.signOut();
                    if (error) {
                        showToast("Erro ao sair.", 'error');
                    } else {
                        showToast("Sessão encerrada.");
                        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                    }
                }
            });
        }
        
        // Função para atualizar o status no Supabase
        async function atualizarStatusPedido(orderId, newStatus) {
            if (!supabaseClient) return;

            const { error } = await supabaseClient
                .from('pedidos_v2')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) {
                showToast(`Erro ao atualizar pedido #${orderId}: ${error.message}`, 'error');
            } else {
                showToast(`Pedido #${orderId} atualizado para "${newStatus}"!`);
            }
        }

        // Função para carregar e exibir os pedidos
        async function carregarPedidosAdmin() {
            if (!adminPedidosList || !supabaseClient) return;
            
            // ★★★ BUSCA O TELEFONE JUNTO COM O PERFIL ★★★
            const { data: pedidos, error } = await supabaseClient
                .from('pedidos_v2')
                .select(`
                    id, 
                    data_pedido, 
                    valor_total, 
                    status, 
                    detalhes_itens,
                    enderecos!left (endereco_completo, observacoes),
                    user_id:Perfis!left (nome_usuario, telefone) 
                `)
                .order('data_pedido', { ascending: false }); // Mais novos primeiro

            if (adminLoading) adminLoading.style.display = 'none'; // Esconde o loading

            if (error) {
                console.error("Erro ao buscar pedidos (Admin):", error);
                adminPedidosList.innerHTML = `<p class="text-red-500 font-bold">Erro ao carregar pedidos: ${error.message}</p>`;
                return;
            }

            if (pedidos.length === 0) {
                adminPedidosList.innerHTML = '<p class="text-center text-gray-700 font-medium pt-4">Nenhum pedido recebido ainda.</p>';
                return;
            }

            adminPedidosList.innerHTML = ''; // Limpa a lista para popular

            pedidos.forEach(pedido => {
                const statusClass = pedido.status ? pedido.status.replace(/\s/g, '') : 'Recebido'; 
                
                // ★★★ LINHA CORRIGIDA PARA EVITAR O CRASH ★★★
                const dataFormatada = new Date(pedido.data_pedido).toLocaleString('pt-BR');
                
                // Itens
                const itensList = (pedido.detalhes_itens || [])
                    .map(item => `<li class="ml-5">${item.quantity}x ${item.name} (${formatCurrency(item.price)})</li>`)
                    .join('');
                
                // ★★★ CAPTURA OS DADOS REAIS (CLIENTE E TELEFONE) ★★★
                const endereco = (pedido.enderecos && pedido.enderecos.endereco_completo) ? pedido.enderecos.endereco_completo : 'Endereço não encontrado.';
                const cliente = (pedido.user_id && pedido.user_id.nome_usuario) ? pedido.user_id.nome_usuario : 'Cliente não encontrado.';
                const telefone = (pedido.user_id && pedido.user_id.telefone) ? pedido.user_id.telefone : 'Não informado.';
                // ★★★ FIM DA MODIFICAÇÃO ★★★

                const pedidoCard = document.createElement('div');
                pedidoCard.classList.add('bg-white', 'p-6', 'rounded-lg', 'shadow-lg', 'border-l-4');
                // Muda a cor da borda baseado no status
                if (statusClass === 'Recebido') pedidoCard.classList.add('border-yellow-500');
                else if (statusClass === 'Preparando') pedidoCard.classList.add('border-blue-500');
                else if (statusClass === 'Entregue') pedidoCard.classList.add('border-green-500');
                else pedidoCard.classList.add('border-red-500');
                
                // ★★★ ATUALIZA O HTML DO CARD PARA INCLUIR O TELEFONE ★★★
                pedidoCard.innerHTML = `
                    <div class="flex flex-col sm:flex-row justify-between sm:items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-[#b96d5c]">Pedido #${pedido.id}</h3>
                            <p class="text-sm text-gray-500">Recebido em: ${dataFormatada}</p>
                        </div>
                        <div class="text-left sm:text-right mt-2 sm:mt-0">
                            <p class="font-bold text-2xl text-[#014926]">${formatCurrency(pedido.valor_total)}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 border-t pt-4">
                        <div>
                            <p class="font-semibold text-gray-800">Cliente:</p>
                            <p class="text-gray-600">${cliente}</p>
                            
                            <p class="font-semibold text-gray-800 mt-3">Telefone (WhatsApp):</p>
                            <p class="text-green-700 font-bold">${telefone}</p>
                        </div>
                        <div class="md:col-span-2">
                            <p class="font-semibold text-gray-800">Endereço de Entrega:</p>
                            <p class="text-gray-600">${endereco}</p>
                        </div>
                    </div>

                    <div class="mb-4">
                        <p class="font-semibold text-gray-800">Itens:</p>
                        <ul class="list-disc text-gray-600 text-sm mt-1 space-y-1">
                            ${itensList}
                        </ul>
                    </div>
                    
                    <div class="text-right pt-4 border-t border-gray-200">
                        <label for="status-${pedido.id}" class="font-bold text-gray-700 mr-2 text-sm sm:text-base">Mudar Status:</label>
                        <select id="status-${pedido.id}" class="admin-status-select status-${statusClass}" data-order-id="${pedido.id}">
                            <option value="Recebido" ${pedido.status === 'Recebido' ? 'selected' : ''}>Recebido</option>
                            <option value="Preparando" ${pedido.status === 'Preparando' ? 'selected' : ''}>Preparando</option>
                            <option value="Entregue" ${pedido.status === 'Entregue' ? 'selected' : ''}>Entregue</option>
                            <option value="Cancelado" ${pedido.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                `;
                adminPedidosList.appendChild(pedidoCard);
            });
        }
        
        // Adiciona o 'listener' para os seletores de status
        adminPedidosList.addEventListener('change', (event) => {
            if (event.target.classList.contains('admin-status-select')) {
                const orderId = event.target.dataset.orderId;
                const newStatus = event.target.value;
                
                // Remove classes de status antigas e adiciona a nova
                event.target.classList.remove('status-Recebido', 'status-Preparando', 'status-Entregue', 'status-Cancelado');
                event.target.classList.add(`status-${newStatus.replace(/\s/g, '')}`);
                
                // Atualiza a borda do card pai
                const card = event.target.closest('.bg-white');
                card.classList.remove('border-yellow-500', 'border-blue-500', 'border-green-500', 'border-red-500');
                if (newStatus === 'Recebido') card.classList.add('border-yellow-500');
                else if (newStatus === 'Preparando') card.classList.add('border-blue-500');
                else if (newStatus === 'Entregue') card.classList.add('border-green-500');
                else card.classList.add('border-red-500');
                
                atualizarStatusPedido(orderId, newStatus);
            }
        });

        // GATEKEEPER: Verifica se o usuário é admin antes de carregar
        async function checkAdminAccess() {
            if (!supabaseClient) {
                showToast("Falha na conexão com o banco.", 'error');
                return;
            }

            const { data: { user } } = await supabaseClient.auth.getUser();

            if (!user) {
                // Não está logado, chuta para o login
                showToast("Acesso restrito. Por favor, faça login.", 'error');
                setTimeout(() => { window.location.href = 'login.html?redirect=admin.html'; }, 1000);
                return;
            }

            if (user.email !== ADMIN_EMAIL) {
                // Logado, mas não é o admin, chuta para o index
                showToast("Você não tem permissão para acessar esta página.", 'error');
                setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                return;
            }

            // Se chegou aqui, é o admin. Carrega os pedidos.
            carregarPedidosAdmin();
        }
        
        checkAdminAccess(); // Roda a verificação de segurança ao carregar a página
    }
    
});