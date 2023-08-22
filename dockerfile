# pull dell'immagine ufficiale
FROM node:18.17.0-alpine

# scelta della directory di lavoro
WORKDIR /opt/mygraph

# copio i file necessari per la distro
COPY ./src/ ./src
COPY ./entrypoint.sh .
COPY ./package.json .
COPY ./package-lock.json .
COPY ./server.ts .
COPY ./swagger.yml .
COPY ./tsconfig.json .

# rendo eseguibile il file entrypoint.sh
RUN sed -i 's/\r$//g' entrypoint.sh
RUN chmod +x entrypoint.sh

# installazione moduli node necessari
RUN npm install

# richiamo del compilatore TS per generare la cartella dist
RUN npm run build

# run entrypoint.sh
# attende che il database sia up and running
# se richiesto esegue il seeding
ENTRYPOINT ["./entrypoint.sh"]