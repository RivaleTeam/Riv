@echo off
REM Pega o nome da pasta atual
for /d %%F in ("%cd%") do set "folder_name=%%~nxF"

REM Adiciona o diretório atual à lista de diretórios seguros do Git
git config --global --add safe.directory %cd%

REM Inicializa o repositório Git (caso não tenha sido inicializado)
git init

REM Cria ou atualiza o arquivo .gitignore para ignorar a pasta node_modules
echo node_modules/ > .gitignore
echo dist/ >> .gitignore
echo output/ >> .gitignore

REM Cria o repositório privado no GitHub com o nome da pasta
gh repo create %folder_name% --public --source=. --remote=origin

REM Adiciona todos os arquivos ao repositório, mas ignora node_modules
git add .

REM Faz o commit dos arquivos
git commit -m "Primeiro commit - %folder_name%"

REM Verifica a branch atual e renomeia para 'main'
git branch -M main

REM Envia os arquivos para o repositório no GitHub
git push -u origin main

echo Repositório %folder_name% criado como privado e arquivos enviados com sucesso!
pause