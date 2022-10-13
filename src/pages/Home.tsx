import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <div>home</div>
      <button onClick={ () => navigate('/about') }>go about</button>
    </>
  );
}

export default Home;