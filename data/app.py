import customtkinter as ctk
import json
import uuid # Para gerar IDs únicos
import os
import shutil # Para copiar arquivos
from tkinter import filedialog # Para a janela de seleção de arquivo

class JanelaFormularioNoticia(ctk.CTkToplevel):
    def __init__(self, master, callback_salvar):
        super().__init__(master)
        self.title("Adicionar Nova Notícia")
        self.geometry("800x750")
        self.resizable(False, False)
        self.transient(master) # Mantém a janela sobre a principal
        self.grab_set() # Bloqueia interação com a janela principal

        self.callback_salvar = callback_salvar

        # --- Widgets do Formulário ---
        self.frame_formulario = ctk.CTkScrollableFrame(self, label_text="Preencha os dados da notícia")
        self.frame_formulario.pack(expand=True, fill="both", padx=10, pady=10)

        # Variáveis
        self.id_var = ctk.StringVar(value=f"noticia-{uuid.uuid4().hex[:8]}")
        self.data_var = ctk.StringVar()
        self.titulo_var = ctk.StringVar()
        self.subtitulo_var = ctk.StringVar()
        self.foto_principal_var = ctk.StringVar()
        self.foto_secundaria_var = ctk.StringVar()
        self.destaque_var = ctk.BooleanVar()

        # ID (não editável)
        ctk.CTkLabel(self.frame_formulario, text="ID (gerado automaticamente):").pack(anchor="w", padx=20, pady=(10, 0))
        ctk.CTkEntry(self.frame_formulario, textvariable=self.id_var, state="readonly").pack(pady=5, padx=20, fill="x")

        # Título
        ctk.CTkLabel(self.frame_formulario, text="Título:").pack(anchor="w", padx=20, pady=(10, 0))
        ctk.CTkEntry(self.frame_formulario, textvariable=self.titulo_var).pack(pady=5, padx=20, fill="x")

        # Subtítulo
        ctk.CTkLabel(self.frame_formulario, text="Subtítulo:").pack(anchor="w", padx=20, pady=(10, 0))
        ctk.CTkEntry(self.frame_formulario, textvariable=self.subtitulo_var).pack(pady=5, padx=20, fill="x")

        # Data
        ctk.CTkLabel(self.frame_formulario, text="Data (AAAA-MM-DD):").pack(anchor="w", padx=20, pady=(10, 0))
        ctk.CTkEntry(self.frame_formulario, textvariable=self.data_var).pack(pady=5, padx=20, anchor="w")

        # --- Seleção de Imagens ---
        # Foto Principal
        ctk.CTkLabel(self.frame_formulario, text="Foto Principal:").pack(anchor="w", padx=20, pady=(10, 0))
        frame_foto1 = ctk.CTkFrame(self.frame_formulario)
        frame_foto1.pack(fill="x", padx=20, pady=5)
        self.entry_foto_principal = ctk.CTkEntry(frame_foto1, textvariable=self.foto_principal_var, state="readonly")
        self.entry_foto_principal.pack(side="left", fill="x", expand=True, padx=(0, 5))
        ctk.CTkButton(frame_foto1, text="Selecionar...", command=lambda: self.selecionar_imagem(self.foto_principal_var)).pack(side="left")

        # Foto Secundária
        ctk.CTkLabel(self.frame_formulario, text="Foto Secundária (opcional):").pack(anchor="w", padx=20, pady=(10, 0))
        frame_foto2 = ctk.CTkFrame(self.frame_formulario)
        frame_foto2.pack(fill="x", padx=20, pady=5)
        self.entry_foto_secundaria = ctk.CTkEntry(frame_foto2, textvariable=self.foto_secundaria_var, state="readonly")
        self.entry_foto_secundaria.pack(side="left", fill="x", expand=True, padx=(0, 5))
        ctk.CTkButton(frame_foto2, text="Selecionar...", command=lambda: self.selecionar_imagem(self.foto_secundaria_var)).pack(side="left")

        # Conteúdo
        ctk.CTkLabel(self.frame_formulario, text="Conteúdo Principal:").pack(anchor="w", padx=20, pady=(10, 0))
        self.textbox_conteudo = ctk.CTkTextbox(self.frame_formulario, height=100)
        self.textbox_conteudo.pack(pady=5, padx=20, fill="both", expand=True)

        # Conteúdo Adicional (com editor)
        ctk.CTkLabel(self.frame_formulario, text="Conteúdo Adicional:").pack(anchor="w", padx=20, pady=(10, 0))
        
        # Barra de ferramentas de formatação
        toolbar_frame = ctk.CTkFrame(self.frame_formulario)
        toolbar_frame.pack(fill="x", padx=20, pady=(5,0))
        
        # Botões de formatação
        btn_bold = ctk.CTkButton(toolbar_frame, text="Negrito", width=80, command=lambda: self.aplicar_tag("b"))
        btn_bold.pack(side="left", padx=5, pady=5)
        
        btn_italic = ctk.CTkButton(toolbar_frame, text="Itálico", width=80, command=lambda: self.aplicar_tag("i"))
        btn_italic.pack(side="left", padx=5, pady=5)

        btn_h3 = ctk.CTkButton(toolbar_frame, text="Título", width=80, command=lambda: self.aplicar_tag("h3"))
        btn_h3.pack(side="left", padx=5, pady=5)

        btn_p = ctk.CTkButton(toolbar_frame, text="Parágrafo", width=90, command=lambda: self.aplicar_tag("p"))
        btn_p.pack(side="left", padx=5, pady=5)

        btn_ul = ctk.CTkButton(toolbar_frame, text="Lista", width=80, command=self.adicionar_lista)
        btn_ul.pack(side="left", padx=5, pady=5)

        # Caixa de texto para o conteúdo adicional
        self.textbox_conteudo_adicional = ctk.CTkTextbox(self.frame_formulario, height=150)
        self.textbox_conteudo_adicional.pack(pady=(0,5), padx=20, fill="both", expand=True)
        
        # Destaque
        self.check_destaque = ctk.CTkCheckBox(self.frame_formulario, text="Marcar como Destaque", variable=self.destaque_var, onvalue=True, offvalue=False)
        self.check_destaque.pack(pady=10, padx=20, anchor="w")

        # Botão Salvar
        ctk.CTkButton(self, text="Salvar Notícia", command=self.salvar, height=40, fg_color="green").pack(pady=10, padx=10, fill="x")

    def aplicar_tag(self, tag_name):
        """Aplica uma tag HTML ao texto selecionado no conteúdo adicional."""
        try:
            # Pega os índices do início e do fim da seleção
            start, end = self.textbox_conteudo_adicional.tag_ranges("sel")
            texto_selecionado = self.textbox_conteudo_adicional.get(start, end)
            
            # Cria o novo texto com as tags
            texto_formatado = f"<{tag_name}>{texto_selecionado}</{tag_name}>"
            
            # Remove o texto antigo e insere o novo
            self.textbox_conteudo_adicional.delete(start, end)
            self.textbox_conteudo_adicional.insert(start, texto_formatado)
        except Exception:
            # Se não houver texto selecionado, não faz nada
            pass

    def adicionar_lista(self):
        """Insere um modelo de lista HTML onde o cursor estiver."""
        modelo_lista = "<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>"
        self.textbox_conteudo_adicional.insert("insert", modelo_lista)

    def selecionar_imagem(self, var_alvo):
        """Abre a janela para selecionar um arquivo de imagem e copia para a pasta do projeto."""
        caminho_imagem = filedialog.askopenfilename(
            title="Selecione uma imagem",
            filetypes=[("Arquivos de Imagem", "*.jpg *.jpeg *.png *.gif *.webp")]
        )
        if not caminho_imagem:
            return # Usuário cancelou

        # Define a pasta de destino
        pasta_destino = "../images/noticias"
        if not os.path.exists(pasta_destino):
            os.makedirs(pasta_destino) # Cria a pasta se não existir

        # Copia o arquivo para a pasta de destino
        nome_arquivo = os.path.basename(caminho_imagem)
        caminho_destino = os.path.join(pasta_destino, nome_arquivo)

        origem_abs = os.path.abspath(caminho_imagem)
        destino_abs = os.path.abspath(caminho_destino)

        if origem_abs != destino_abs:
            shutil.copy(origem_abs, destino_abs)

        # Atualiza o campo de texto com o caminho relativo
        # Usamos barras normais (/) para compatibilidade web
        caminho_relativo_web = f"../images/noticias/{nome_arquivo}"
        var_alvo.set(caminho_relativo_web)

    def salvar(self):
        """Coleta os dados do formulário, cria um dicionário e envia para a função de callback."""
        nova_noticia = {
            "id": self.id_var.get(),
            "data": self.data_var.get(),
            "titulo": self.titulo_var.get(),
            "subtitulo": self.subtitulo_var.get(),
            "foto_principal": self.foto_principal_var.get(),
            "foto_secundaria": self.foto_secundaria_var.get() or None, # Salva None se estiver vazio
            "conteudo": self.textbox_conteudo.get("1.0", "end-1c"),
            "conteudo_adicional": self.textbox_conteudo_adicional.get("1.0", "end-1c")
        }
        
        # Validação simples
        if not nova_noticia["titulo"] or not nova_noticia["data"]:
            # (Aqui poderíamos mostrar uma mensagem de erro)
            print("Erro: Título e Data são obrigatórios.")
            return

        eh_destaque = self.destaque_var.get()
        self.callback_salvar(nova_noticia, eh_destaque)
        self.destroy()

# --- Janela de Gerenciamento de Notícias ---
# Esta é a janela que criamos antes, agora encapsulada em uma classe.
class JanelaNoticias(ctk.CTkToplevel):
    def __init__(self, master=None):
        super().__init__(master)
        self.title("Gerenciador de Notícias")
        self.geometry("1100x700") # Aumentei um pouco o tamanho da janela
        self.resizable(True, True) # Permitir redimensionar

        self.dados = None
        self.noticias = []
        self.carregar_dados()

        # Guarda o índice da notícia atualmente selecionada
        self.indice_selecionado = None

        # Configura o grid da janela (2 colunas)
        self.grid_columnconfigure(0, weight=1, minsize=300) # Coluna da lista
        self.grid_columnconfigure(1, weight=3)              # Coluna dos detalhes
        self.grid_rowconfigure(0, weight=1)

        # --- Frame da Esquerda (Lista de Notícias e Botões) ---
        self.frame_esquerda = ctk.CTkFrame(self)
        self.frame_esquerda.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        self.frame_esquerda.grid_rowconfigure(1, weight=1)

        label_lista = ctk.CTkLabel(self.frame_esquerda, text="Notícias Cadastradas", font=ctk.CTkFont(size=16, weight="bold"))
        label_lista.grid(row=0, column=0, columnspan=2, padx=10, pady=10)

        self.lista_noticias = ctk.CTkScrollableFrame(self.frame_esquerda, label_text="")
        self.lista_noticias.grid(row=1, column=0, columnspan=2, padx=10, pady=5, sticky="nsew")
        
        self.frame_botoes = ctk.CTkFrame(self.frame_esquerda)
        self.frame_botoes.grid(row=2, column=0, columnspan=2, padx=10, pady=10, sticky="ew")
        self.frame_botoes.grid_columnconfigure((0, 1, 2, 3), weight=1)

        self.botao_adicionar = ctk.CTkButton(self.frame_botoes, text="Adicionar", command=self.abrir_janela_adicionar)
        self.botao_adicionar.grid(row=0, column=0, padx=5, pady=5, sticky="ew")

        self.botao_editar = ctk.CTkButton(self.frame_botoes, text="Editar")
        self.botao_editar.grid(row=0, column=1, padx=5, pady=5, sticky="ew")

        self.botao_excluir = ctk.CTkButton(self.frame_botoes, text="Excluir")
        self.botao_excluir.grid(row=0, column=2, padx=5, pady=5, sticky="ew")
        
        self.botao_salvar = ctk.CTkButton(self.frame_botoes, text="Salvar", fg_color="green")
        self.botao_salvar.grid(row=0, column=3, padx=5, pady=5, sticky="ew")

        # --- Frame da Direita (Detalhes da Notícia) ---
        self.frame_direita = ctk.CTkScrollableFrame(self, label_text="Detalhes da Notícia", label_font=ctk.CTkFont(size=16, weight="bold"))
        self.frame_direita.grid(row=0, column=1, padx=10, pady=10, sticky="nsew")

        # Variáveis para armazenar os dados dos campos
        self.id_var = ctk.StringVar()
        self.data_var = ctk.StringVar()
        self.titulo_var = ctk.StringVar()
        self.subtitulo_var = ctk.StringVar()
        self.foto_principal_var = ctk.StringVar()
        self.foto_secundaria_var = ctk.StringVar()
        self.destaque_var = ctk.BooleanVar()

        # Criando os campos (widgets) para cada atributo da notícia
        # ID (geralmente não editável pelo usuário)
        ctk.CTkLabel(self.frame_direita, text="ID:").pack(anchor="w", padx=20, pady=(10, 0))
        self.entry_id = ctk.CTkEntry(self.frame_direita, textvariable=self.id_var, state="readonly")
        self.entry_id.pack(pady=5, padx=20, fill="x")

        # Título
        ctk.CTkLabel(self.frame_direita, text="Título:").pack(anchor="w", padx=20, pady=(10, 0))
        self.entry_titulo = ctk.CTkEntry(self.frame_direita, textvariable=self.titulo_var, state="readonly")
        self.entry_titulo.pack(pady=5, padx=20, fill="x")

        # Subtítulo
        ctk.CTkLabel(self.frame_direita, text="Subtítulo:").pack(anchor="w", padx=20, pady=(10, 0))
        self.entry_subtitulo = ctk.CTkEntry(self.frame_direita, textvariable=self.subtitulo_var, state="readonly")
        self.entry_subtitulo.pack(pady=5, padx=20, fill="x")

        # Data
        ctk.CTkLabel(self.frame_direita, text="Data (AAAA-MM-DD):").pack(anchor="w", padx=20, pady=(10, 0))
        self.entry_data = ctk.CTkEntry(self.frame_direita, textvariable=self.data_var, state="readonly")
        self.entry_data.pack(pady=5, padx=20, anchor="w")

        # Foto Principal
        ctk.CTkLabel(self.frame_direita, text="Foto Principal (caminho):").pack(anchor="w", padx=20, pady=(10, 0))
        self.entry_foto_principal = ctk.CTkEntry(self.frame_direita, textvariable=self.foto_principal_var, state="readonly")
        self.entry_foto_principal.pack(pady=5, padx=20, fill="x")

        # Foto Secundária
        ctk.CTkLabel(self.frame_direita, text="Foto Secundária (caminho):").pack(anchor="w", padx=20, pady=(10, 0))
        self.entry_foto_secundaria = ctk.CTkEntry(self.frame_direita, textvariable=self.foto_secundaria_var, state="readonly")
        self.entry_foto_secundaria.pack(pady=5, padx=20, fill="x")

        # Conteúdo
        ctk.CTkLabel(self.frame_direita, text="Conteúdo:").pack(anchor="w", padx=20, pady=(10, 0))
        self.textbox_conteudo = ctk.CTkTextbox(self.frame_direita, height=150, state="disabled")
        self.textbox_conteudo.pack(pady=5, padx=20, fill="both", expand=True)

        # Conteúdo Adicional
        ctk.CTkLabel(self.frame_direita, text="Conteúdo Adicional (HTML permitido):").pack(anchor="w", padx=20, pady=(10, 0))
        self.textbox_conteudo_adicional = ctk.CTkTextbox(self.frame_direita, height=100, state="disabled")
        self.textbox_conteudo_adicional.pack(pady=5, padx=20, fill="both", expand=True)
        
        # Checkbox de Destaque
        self.check_destaque = ctk.CTkCheckBox(self.frame_direita, text="Marcar como Destaque", variable=self.destaque_var, onvalue=True, offvalue=False, state="disabled")
        self.check_destaque.pack(pady=10, padx=20, anchor="w")

        self.atualizar_lista_noticias()

    def abrir_janela_adicionar(self):
        """Abre a janela de formulário para adicionar uma nova notícia."""
        JanelaFormularioNoticia(self, callback_salvar=self.adicionar_nova_noticia)

    def adicionar_nova_noticia(self, noticia, eh_destaque):
        """Recebe a nova notícia do formulário, adiciona aos dados e salva."""
        # Adiciona a nova notícia à lista de notícias em memória
        self.noticias.insert(0, noticia) # Insere no início

        # Se for destaque, adiciona o ID à lista de destaques
        if eh_destaque:
            if noticia["id"] not in self.dados["destaques"]:
                self.dados["destaques"].append(noticia["id"])
        
        # Atualiza a lista na interface
        self.atualizar_lista_noticias()
        
        # Salva os dados no arquivo JSON
        self.salvar_alteracoes_no_arquivo()
        print(f"Notícia '{noticia['titulo']}' adicionada com sucesso!")
    
    def salvar_alteracoes_no_arquivo(self):
        """Salva o estado atual dos dados (self.dados) no arquivo JSON."""
        # Atualiza a lista de notícias no dicionário principal
        self.dados['noticias'] = self.noticias
        
        try:
            with open("noticias.json", "w", encoding="utf-8") as f:
                json.dump(self.dados, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Erro ao salvar o arquivo: {e}")
            # (Aqui poderíamos mostrar uma mensagem de erro para o usuário)

    def carregar_dados(self):
        """Carrega os dados do arquivo jornal.json"""
        try:
            with open("jornal.json", "r", encoding="utf-8") as f:
                self.dados = json.load(f)
                self.noticias = self.dados['noticias']
        except (FileNotFoundError, json.JSONDecodeError):
            # Se o arquivo não existir ou for inválido, começa com uma estrutura vazia
            self.dados = {"destaques": [], "noticias": []}
            self.noticias = []

    def atualizar_lista_noticias(self):
        """Limpa e recarrega a lista de notícias na interface."""
        # Limpa a lista antiga
        for widget in self.lista_noticias.winfo_children():
            widget.destroy()

        # Adiciona um botão para cada notícia
        for i, noticia in enumerate(self.noticias):
            titulo = noticia.get("titulo", "Sem título")
            # Usamos uma função lambda para passar o índice da notícia para o comando
            btn = ctk.CTkButton(
                self.lista_noticias,
                text=titulo,
                fg_color="transparent",
                text_color=("black", "white"),
                anchor="w",
                command=lambda index=i: self.mostrar_detalhes(index)
            )
            btn.pack(fill="x", padx=5, pady=2)

    def mostrar_detalhes(self, index):
        self.indice_selecionado = index
        noticia = self.noticias[index]
        
        # Limpa os campos antes de preencher
        self.limpar_campos_detalhes()

        # Preenche as variáveis com os dados da notícia
        self.id_var.set(noticia.get("id", ""))
        self.data_var.set(noticia.get("data", ""))
        self.titulo_var.set(noticia.get("titulo", ""))
        self.subtitulo_var.set(noticia.get("subtitulo", ""))
        self.foto_principal_var.set(noticia.get("foto_principal", ""))
        
        # Lida com o campo 'foto_secundaria' que pode ser nulo
        foto_sec = noticia.get("foto_secundaria")
        self.foto_secundaria_var.set(foto_sec if foto_sec is not None else "")

        # Preenche os Textbox
        self.textbox_conteudo.configure(state="normal")
        self.textbox_conteudo.insert("1.0", noticia.get("conteudo", ""))
        self.textbox_conteudo.configure(state="disabled")

        self.textbox_conteudo_adicional.configure(state="normal")
        self.textbox_conteudo_adicional.insert("1.0", noticia.get("conteudo_adicional", ""))
        self.textbox_conteudo_adicional.configure(state="disabled")
        
        # Verifica se a notícia é um destaque
        if noticia.get("id") in self.dados.get("destaques", []):
            self.destaque_var.set(True)
        else:
            self.destaque_var.set(False)

    def limpar_campos_detalhes(self):
        """Limpa todos os campos da tela de detalhes."""
        self.id_var.set("")
        self.data_var.set("")
        self.titulo_var.set("")
        self.subtitulo_var.set("")
        self.foto_principal_var.set("")
        self.foto_secundaria_var.set("")
        self.destaque_var.set(False)

        # Habilita, limpa e desabilita os textboxes
        for textbox in [self.textbox_conteudo, self.textbox_conteudo_adicional]:
            textbox.configure(state="normal")
            textbox.delete("1.0", "end")
            textbox.configure(state="disabled")

# --- Tela Principal (Menu) ---
class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Gerenciador de Conteúdo da Paróquia")
        self.geometry("400x300")
        self.resizable(False, False)

        # Centraliza os widgets na janela
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(0, weight=1)

        # Frame principal para organizar os botões
        main_frame = ctk.CTkFrame(self)
        main_frame.grid(row=0, column=0, padx=20, pady=20)

        label = ctk.CTkLabel(main_frame, text="Selecione o que deseja gerenciar:", font=ctk.CTkFont(size=16, weight="bold"))
        label.pack(pady=20, padx=20)

        # Botão para abrir o gerenciador de notícias
        botao_noticias = ctk.CTkButton(main_frame, text="Gerenciar Notícias", command=self.abrir_janela_noticias, height=40)
        botao_noticias.pack(pady=10, padx=20, fill="x")

        # (Futuramente, outros botões podem ser adicionados aqui)
        # botao_eventos = ctk.CTkButton(main_frame, text="Gerenciar Eventos", state="disabled")
        # botao_eventos.pack(pady=10, padx=20, fill="x")

        self.janela_noticias = None # Para garantir que apenas uma janela de notícias seja aberta

    def abrir_janela_noticias(self):
        # Verifica se a janela já não está aberta ou foi minimizada
        if self.janela_noticias is None or not self.janela_noticias.winfo_exists():
            self.janela_noticias = JanelaNoticias(self)  # Cria a janela de notícias
            self.janela_noticias.transient(self) # Faz a janela de notícias aparecer sobre a principal
        else:
            self.janela_noticias.focus()  # Se já estiver aberta, apenas foca nela

if __name__ == "__main__":
    ctk.set_appearance_mode("System") # Pode ser "Light", "Dark"
    ctk.set_default_color_theme("blue")
    
    app = App()
    app.mainloop()
