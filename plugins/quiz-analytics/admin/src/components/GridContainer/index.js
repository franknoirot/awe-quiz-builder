import styled from 'styled-components'

const GridContainer = styled.div`
    margin: 2em 0;
    display: grid;
    grid-template-columns: repeat(${ props => props.columns ? props.columns : 3 }, 1fr);
    align-items: center;
    justify-content: center;
`

export default GridContainer