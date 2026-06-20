import { useNavigate } from "react-router-dom";

const TopCategoriesCard = ({ img: Img, text }) => {
  const navigate = useNavigate();

  return (
    <div className="TopCategories-card" onClick={() => navigate(`/search?q=${encodeURIComponent(text)}`)}>
      <img src={Img} className="TopCategories-img" />
      <span className="TopCategories-text">{text}</span>
    </div>
  );
};

export default TopCategoriesCard;
