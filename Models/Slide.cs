namespace task6.Models
{
    public class Slide
    {
        public string Id { get; set; }
        public List<Element> Elements { get; set; } = new List<Element>();
    }
}
