<template>
  <div>
    <!--<canvas id="hexocet"></canvas>-->
    <h1 class="otto">Provérbio do Dia</h1>
    <h2>Capítulo {{ date.getDate() }}</h2>
    <p>{{ formattedDate }}</p>
    <a class='sx-link' href='http://www.artesdosul.com/' target='_blank' title="artesdosul"><img class="sx-logo" src="/artesdosul-as7.png" alt="artesdosul"/></a>
    <vue-plyr>
      <audio controls playsinline>
        <source :src="dailyAudio" type="audio/mp3">
        Your browser does not support the audio element.
      </audio>
    </vue-plyr>
  </div>
</template>

<script lang="ts">
const dateInformation = new Date();

export default {
  data() {
    return {
      date: dateInformation,
    };
  },
  computed: {
    dailyAudio() {
      return `./proverbios.br/proverbios${this.date.getDate()}.mp3`;
    },
    formattedDate() {
      const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return this.date.toLocaleDateString('pt-BR', options as Intl.DateTimeFormatOptions);
    },
  },
};
</script>

<style scoped></style>
