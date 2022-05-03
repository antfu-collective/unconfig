import a from 'stub'

export default ({ command }) => {
  return a({
    rewrite: command === 'dev' ? 'Hi' : 'Bye',
  })
}
