const { NlpManager } = require('node-nlp-rn');

export default async function processTextToCommand(text, locale) {
  const manager = new NlpManager({
    languages : [locale.slice(0,2)],
    ner: { useDuckling: true } 
  });
  const response = await manager.process(locale.slice(0,2), text);
  console.log(JSON.stringify(response, null, '\t'));
  if (!response) return;

  const command = {
    result: '',
    title: '',
    duration: 0
  };

  let processedText = text;
  const durationIndexes = [];
  response.entities.map(entity => {
    if (entity.entity === 'duration') {
      command.duration = Number(command.duration) + Number(entity.resolution.values[0].value);
    }
    durationIndexes.push(entity.start);
    durationIndexes.push(entity.end);
    // console.log(processedText);
  });

  const durationStart = Math.min(...durationIndexes);
  const durationEnd = Math.max(...durationIndexes);
  
  if (durationStart && durationEnd) {
    processedText = text.slice(0, durationStart) + text.slice(durationEnd + 1,);
  }

  // // extract tags
  // for (word in processedText.split(' ')) {
  //   if ('#' in word) {
  //     command.tags.push(word);
  //   }
  // }

  // remove prepositions for English
  console.log(response.locale);
  if (response.locale === 'en') {
    console.log('removal')
    const preps = [' of ', ' for '];
    for (prep of preps) {
      processedText = processedText.replace(prep, ' ');
    }
  }
  command.title = processedText;
  
  console.log(command);
  return command;
}
