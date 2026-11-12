// Casos de fuso usados no Node e dentro de cada navegador.
// [data, hora local, fuso, deslocamento esperado em horas (UTC = local - offset)]
export const TZ_CASES = [
  ['1988-08-22','14:10','America/Sao_Paulo',-3],
  ['1990-02-10','12:00','America/Sao_Paulo',-2], // horário de verão 1989-90 até 11/02/1990
  ['1990-02-12','12:00','America/Sao_Paulo',-3],
  ['1989-10-16','12:00','America/Sao_Paulo',-2], // começou 15/10/1989
  ['2018-11-05','12:00','America/Sao_Paulo',-2], // começou 04/11/2018
  ['2019-12-01','12:00','America/Sao_Paulo',-3], // horário de verão extinto em 2019
  ['1992-11-03','12:00','America/Recife',-3],   // Nordeste sem horário de verão em 1992
  ['1985-12-01','12:00','America/Recife',-2],   // Recife teve horário de verão em 1985-86
  ['1975-06-05','12:00','Europe/Oslo',1],
  ['1950-01-01','12:00','America/Sao_Paulo',-2], // horário de verão 1949-50
  ['1900-06-01','12:00','America/Sao_Paulo',-(3+6/60+28/3600)], // hora média local antes de 1914
];