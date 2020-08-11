export default function deleteProps(obj, props) {
    const newObj = {}
    Object.keys(obj).forEach(key => {
      if (props.indexOf(key) === -1) {
        newObj[key] = obj[key]
      }
    })
    return newObj
}