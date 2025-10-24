import customtkinter as ctk
import json
import uuid # Para gerar IDs únicos
import os
import shutil # Para copiar arquivos
import git
from tkinter import filedialog, messagebox # Para a janela de seleção de arquivo

class JanelaFormularioNoticia(ctk.CTkToplevel):
    def __init__(self, master, callback_salvar, noticia_existente=None):
        super().__init__(master)

        self.callback_salvar = callback_salvar
        self.noticia_original_id = None

        if noticia_existente:
            self.title("Editar Notícia")
            self.noticia_original_id = noticia_existente['id']
        else:
            self.title("Adicionar Nova Notícia")

        self.geometry("800x750")
        self.resizable(False, False)
        self.transient(master) # Mantém a janela sobre a principal
        self.grab_set() # Bloqueia interação com a janela principal

        self.frame_formulario = ctk.CTkScrollableFrame(self, label_text=self.title())
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

        if noticia_existente:
            self.preencher_formulario(noticia_existente)

        # Botão Salvar
        ctk.CTkButton(self, text="Salvar Notícia", command=self.salvar, height=40, fg_color="green").pack(pady=10, padx=10, fill="x")


    def preencher_formulario(self, noticia):
        """Preenche os campos do formulário com os dados de uma notícia existente."""
        self.id_var.set(noticia.get("id", ""))
        self.data_var.set(noticia.get("data", ""))
        self.titulo_var.set(noticia.get("titulo", ""))
        self.subtitulo_var.set(noticia.get("subtitulo", ""))
        self.foto_principal_var.set(noticia.get("foto_principal", ""))
        self.foto_secundaria_var.set(noticia.get("foto_secundaria", "") or "")
        
        # Verifica se a notícia é um destaque
        # (Acessa a lista de destaques da janela principal)
        if noticia.get("id") in self.master.dados.get("destaques", []):
            self.destaque_var.set(True)
        else:
            self.destaque_var.set(False)

        # Preenche os campos de texto grandes
        self.textbox_conteudo.insert("1.0", noticia.get("conteudo", ""))
        self.textbox_conteudo_adicional.insert("1.0", noticia.get("conteudo_adicional", ""))
        
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
        """Coleta os dados, envia para o callback e fecha a janela."""
        noticia_modificada = {
            "id": self.id_var.get(),
            "data": self.data_var.get(),
            "titulo": self.titulo_var.get(),
            "subtitulo": self.subtitulo_var.get(),
            "foto_principal": self.foto_principal_var.get(),
            "foto_secundaria": self.foto_secundaria_var.get() or None,
            "conteudo": self.textbox_conteudo.get("1.0", "end-1c"),
            "conteudo_adicional": self.textbox_conteudo_adicional.get("1.0", "end-1c")
        }
        
        if not noticia_modificada["titulo"] or not noticia_modificada["data"]:
            messagebox.showerror("Erro", "Os campos 'Título' e 'Data' são obrigatórios.")
            return

        eh_destaque = self.destaque_var.get()
        # AQUI ESTÁ A MUDANÇA PRINCIPAL: Passa 3 argumentos
        self.callback_salvar(self.noticia_original_id, noticia_modificada, eh_destaque)
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
        self.frame_botoes.grid_columnconfigure((0, 1, 2, 3, 4), weight=1)

        self.botao_adicionar = ctk.CTkButton(self.frame_botoes, text="Adicionar", command=self.abrir_janela_adicionar)
        self.botao_adicionar.grid(row=0, column=0, padx=5, pady=5, sticky="ew")

        self.botao_editar = ctk.CTkButton(self.frame_botoes, text="Editar", command=self.abrir_janela_editar, state="disabled")
        self.botao_editar.grid(row=0, column=1, padx=5, pady=5, sticky="ew")

        self.botao_excluir = ctk.CTkButton(self.frame_botoes, text="Excluir")
        self.botao_excluir.grid(row=0, column=2, padx=5, pady=5, sticky="ew")
        
        self.botao_salvar = ctk.CTkButton(self.frame_botoes, text="Salvar", fg_color="green")
        self.botao_salvar.grid(row=0, column=3, padx=5, pady=5, sticky="ew")

        self.botao_publicar = ctk.CTkButton(self.frame_botoes, text="Publicar", fg_color="#34568B", command=self.git_push)
        self.botao_publicar.grid(row=0, column=4, padx=5, pady=5, sticky="ew")

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

    def git_push(self):
        """Executa 'git push' para enviar os commits locais para o repositório remoto."""
        # Pergunta ao usuário se ele realmente quer publicar
        if not messagebox.askyesno("Confirmar Publicação", "Você tem certeza que deseja enviar todas as alterações salvas para o servidor?\n\nIsso pode atualizar o site ao vivo."):
            return

        try:
            self.configure(cursor="watch") # Muda o cursor para "espera"
            self.update_idletasks() # Força a atualização da UI

            repo = git.Repo('.')
            
            # Verifica se existe um remoto chamado 'origin'
            if 'origin' not in [remote.name for remote in repo.remotes]:
                messagebox.showerror("Erro de Push", "Nenhum repositório remoto 'origin' configurado.\n\nConfigure-o via linha de comando com 'git remote add origin <URL>'.")
                return

            origin = repo.remote(name='origin')
            
            # Executa o push
            push_info = origin.push()

            # Verifica se houve algum erro no push
            if any(info.flags & git.PushInfo.ERROR for info in push_info):
                # Tenta extrair uma mensagem de erro, se houver
                error_summary = push_info[0].summary if push_info else "Erro desconhecido."
                raise RuntimeError(f"Falha no push: {error_summary}")

            messagebox.showinfo("Publicado com Sucesso", "As alterações foram enviadas para o servidor com sucesso!")

        except Exception as e:
            messagebox.showerror("Erro de Push", f"Falha ao enviar as alterações para o servidor:\n\n{e}")
        finally:
            self.configure(cursor="") # Restaura o cursor ao normal
            self.update_idletasks()

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
        self.salvar_alteracoes_no_arquivo(commit_message=f"Adiciona notícia: {noticia['titulo'][:30]}...")
        print(f"Notícia '{noticia['titulo']}' adicionada com sucesso!")
    
    def salvar_alteracoes_no_arquivo(self):
        """Salva o estado atual dos dados (self.dados) no arquivo JSON."""
        # Atualiza a lista de notícias no dicionário principal
        self.dados['noticias'] = self.noticias

        caminho_arquivo_json = "noticias.json"
        
        try:
            with open("jornal.json", "w", encoding="utf-8") as f:
                json.dump(self.dados, f, indent=2, ensure_ascii=False)
            print(f"Arquivo '{caminho_arquivo_json}' salvo com sucesso.")

            if not commit_message:
                commit_message = f"Atualiza conteúdo: {os.path.basename(caminho_arquivo_json)}"

            self.commitar_alteracoes(caminho_arquivo_json, mensagem=commit_message)

        except Exception as e:
            print(f"Erro ao salvar o arquivo: {e}")
            messagebox.showerror("Erro", f"Ocorreu um erro ao salvar as alterações: {e}")
            # (Aqui poderíamos mostrar uma mensagem de erro para o usuário)

    def commitar_alteracoes(self, arquivo_modificado, mensagem):
        """Adiciona o arquivo modificado e faz um commit no repositório Git."""
        try:
            # Abre o repositório Git na pasta atual
            repo = git.Repo('.')

            # Verifica se o arquivo foi realmente modificado pelo Git
            if not repo.is_dirty(path=arquivo_modificado):
                print("Nenhuma alteração detectada no arquivo para commitar.")
                # Podemos opcionalmente mostrar uma mensagem de que nada mudou
                # messagebox.showinfo("Informação", "Nenhuma alteração para salvar.")
                return

            # Adiciona o arquivo ao stage
            repo.index.add([arquivo_modificado])
            
            # Faz o commit
            repo.index.commit(mensagem)
            
            print(f"Commit realizado com sucesso: '{mensagem}'")
            messagebox.showinfo("Sucesso", "Alterações salvas e commitadas no Git com sucesso!")

        except git.InvalidGitRepositoryError:
            erro_msg = "Erro: A pasta do projeto não é um repositório Git. Execute 'git init'."
            print(erro_msg)
            messagebox.showwarning("Git não encontrado", erro_msg)
        except Exception as e:
            erro_msg = f"Ocorreu um erro durante o commit no Git: {e}"
            print(erro_msg)
            messagebox.showerror("Erro de Git", erro_msg)

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

        self.botao_editar.configure(state="normal")

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
    
    def abrir_janela_editar(self):
        """Abre o formulário para editar a notícia atualmente selecionada."""
        if self.indice_selecionado is None:
            return

        noticia_selecionada = self.noticias[self.indice_selecionado]
        
        # Abre a mesma janela de formulário, mas passando a notícia existente
        JanelaFormularioNoticia(self, 
                                callback_salvar=self.editar_noticia, 
                                noticia_existente=noticia_selecionada)

    def editar_noticia(self, id_original, noticia_modificada, eh_destaque):
        """Substitui os dados da notícia antiga pelos novos e salva."""
        # Encontra a notícia original pelo ID e a substitui
        for i, noticia in enumerate(self.noticias):
            if noticia['id'] == id_original:
                self.noticias[i] = noticia_modificada
                break
        
        # Atualiza a lista de destaques
        id_modificado = noticia_modificada['id']
        # Remove o ID antigo da lista de destaques (caso o ID tenha mudado)
        if id_original in self.dados['destaques']:
            self.dados['destaques'].remove(id_original)
        
        # Adiciona o novo ID se for um destaque
        if eh_destaque and id_modificado not in self.dados['destaques']:
            self.dados['destaques'].append(id_modificado)

        # Reordena as notícias por data, caso a data tenha sido alterada
        self.noticias = sorted(self.dados['noticias'], key=lambda x: x['data'], reverse=True)

        # Atualiza a interface gráfica
        self.atualizar_lista_noticias()
        # Limpa os campos de detalhes, pois os dados podem ter mudado
        self.limpar_campos_detalhes()
        self.botao_editar.configure(state="disabled")
        self.indice_selecionado = None

        # Salva no arquivo e commita
        self.salvar_alteracoes_no_arquivo(commit_message=f"Edita notícia: {noticia_modificada['titulo'][:30]}...")
        print(f"Notícia '{noticia_modificada['titulo']}' editada com sucesso!")

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
