namespace task6.Models
{
    public enum UserType
    {
        Owner,
        Editor,
        Viewer
    }

    public class User
    {
        public string ConnectionId { get; set; }
        public string Nickname { get; set; }
        public UserType Role { get; set; }
    }
}
