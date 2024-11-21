namespace task6.Models
{
    public class Presentation
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public List<Slide> Slides { get; set; } = new List<Slide>();
        public List<User> Users { get; set; } = new List<User>();
    }
}
