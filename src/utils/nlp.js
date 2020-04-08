// const { containerBootstrap } = require('@nlpjs/core');
// const { Nlp } = require('@nlpjs/nlp');
// const { LangEn } = require('@nlpjs/lang-en-min');

// export default async function processTextToCommand (text) {
//   const container = await containerBootstrap();
//   container.use(Nlp);
//   container.use(LangEn);
//   const nlp = container.get('nlp');
//   nlp.settings.autoSave = false;
//   nlp.addLanguage('en');
//   const response = await nlp.process('en', text);
//   console.log(response);
//   return response
// };

const { NlpManager, Language } = require('node-nlp-rn');

export default async function processTextToCommand(text) {
  const manager = new NlpManager({ ner: { useDuckling: true } });
  
  const response = await manager.process(null, text);
  console.log(JSON.stringify(response, null, '\t'));

  const command = {
    result: '',
    title: '',
    duration: ''
  };

  // extract duration
  if (!response) return;
  response.entities.map(entity => {
    if (entity.entity === 'duration') {
      const title = text.slice(0, entity.start) + text.slice(entity.end + 1,);

      command.duration = entity.resolution.values[0].value;
      command.title = title;
      command.result = 'ok';
    } else {
      command.result = 'ng';
    }
  });
  console.log(command);
  return command;
}
