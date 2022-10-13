import { useNavigate } from 'react-router-dom';

function About() {
  const navigate = useNavigate();

  return (
    <>
      <div>About</div>
      <button onClick={ () => navigate('/') }>go home</button>
    </>
  );
}

export default About;